# 并发安全

在Go中能非常方便地实现并发，这使得并发安全格外值得注意。这一章节是我对Go中并发安全的理解。

## 纯函数当然是安全的

大多数情况下，并发安全问题源自共享的可变状态。纯函数消灭了这种共享的可变状态，从而天然具有了并发安全性。

纯函数一般具有以下特性：
1. 不可变：纯函数本身不修改外部数据；
2. 无状态：纯函数自身不维护任何内部状态，每次调用都是独立、新鲜的；
3. 无副作用：不修改外部变量、不执行 I/O、不改变入参、不抛出异常；

下面是一个纯函数的例子：

```go
func splitBy(sep string) func(src string) []string {
	return func(src string) []string {
		return strings.Split(src, sep)
	}
}

func upperCase(src []string) []string {
	result := make([]string, len(src))
	for i, v := range src {
		result[i] = strings.ToUpper(v)
	}
	return result
}

func joinWith(sep string) func(src []string) string {
	return func(src []string) string {
		return strings.Join(src, sep)
	}
}
```

随后调用：

```go
fmt.Println(joinWith(",")(upperCase(splitBy(" ")("The quick brown fox jumps over the lazy dog"))))
```

打印:

```go
THE,QUICK,BROWN,FOX,JUMPS,OVER,THE,LAZY,DOG
```

## 共享数据是不安全的

可我们经常会希望共享数据。当程序中有多个goroutine共享同一个数据时，因为goroutine运行的前后顺序是无法预测的，可能存在潜在的问题，例如：

```go
var total int
var wg sync.WaitGroup
maxNum := 100
wg.Add(maxNum)
for i := range maxNum {
	go func() {
		total = total + i
		wg.Done()
	}()
}
wg.Wait()
expected := (0 + maxNum - 1) * maxNum / 2
fmt.Printf("Result %d; Expecting %d; Correct: %v\n", total, expected, total == expected)
```

运行结果可能是：

```plain
Result 4763; Expecting 4950; Correct: false
```

问题就出在`total = total + i`，它包括“读total”“total + i”“写total”这三部，当有多个goroutine同时运行时，就有可能出现交替执行的情况，比如：

```plain
A: 读total = 0
B: 读total = 0
A: total + 1 = 1
B: total + 2 = 2
B: 写total = 2
A: 写total = 1
```

就会导致结果错误。

### 原子操作

`total = total + i`是分三步走的，因此产生了潜在的问题，那有没有办法保证它一步完成，不可分割呢？有的，这种操作被称为原子操作 —— 像原子一样不可分割。Go提供了`atomic`包来实现原子操作。

```go
	var total atomic.Int64
	var wg sync.WaitGroup
	maxNum := 100
	wg.Add(maxNum)
	for i := range maxNum {
		go func() {
			total.Add(int64(i))
			wg.Done()
		}()
	}
	wg.Wait()
	expected := (0 + maxNum - 1) * maxNum / 2
	actual := total.Load()
	fmt.Printf("Result %d; Expecting %d; Correct: %v\n", actual, expected, int(actual) == expected)
```

因为不会再出现交错执行的问题，所以问题不会再出现，输出总是：

```plain
Result 4950; Expecting 4950; Correct: true
```

### 互斥锁

互斥锁是一个较为通用的方法。为共享数据增加一个互斥锁，就能保证共享数据的安全：

```go
	var total int
	var wg sync.WaitGroup
	var lock sync.Mutex
	maxNum := 100
	wg.Add(maxNum)
	for i := range maxNum {
		go func() {
			lock.Lock()
			total = total + i
			lock.Unlock()
			wg.Done()
		}()
	}
	wg.Wait()
	expected := (0 + maxNum - 1) * maxNum / 2
	fmt.Printf("Result %d; Expecting %d; Correct: %v\n", total, expected, total == expected)
```

它总是输出：

```plain
Result 4950; Expecting 4950; Correct: true
```

每次只能有一个goroutine获得互斥锁，这就保证了同一时刻只有一个goroutine访问共享的变量。对互斥锁的访问的安全性由运行时保证。
