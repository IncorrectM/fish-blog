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
shared := 0
for i := range 15 {
	go func(index int) {
		shared = index
		time.Sleep(time.Duration(rand.Intn(2)) * time.Millisecond) // 为了让数据竞争问题发生
		fmt.Printf("[%d] %d\t", index, shared)
	}(i)
}
time.Sleep(15 * time.Millisecond)
fmt.Println()
```

现代计算机运行速度快，为了看到数据竞争问题，我们手动加入了一点延迟，运行结果可能是：

```plain
[1] 1	[11] 11	[12] 12	[0] 0	[2] 2	[13] 13	[9] 9	[4] 4	[10] 9	[5] 9	[8] 9	[6] 9	[3] 9	[14] 9	[7] 9	
```

可以看到，部分index和shared无法正确对应。

### 互斥锁

为共享数据增加一个互斥锁，就能保证共享数据的安全：

```go
	var lock sync.Mutex
	shared := 0
	for i := range 15 {
		go func(index int) {
			lock.Lock()
			shared = index
			time.Sleep(time.Duration(rand.Intn(2)) * time.Millisecond) // 为了让数据竞争问题发生
			fmt.Printf("[%d] %d\t", index, shared)
			lock.Unlock()
		}(i)
	}
	time.Sleep(15 * time.Millisecond)
	fmt.Println()
```

每次只能有一个goroutine获得互斥锁，这就保证了同一时刻只有一个goroutine访问共享的变量。对互斥锁的访问的安全性由运行时保证。
