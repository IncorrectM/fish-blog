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

## 通道是安全的

## 共享变量是不安全的
