# Goroutine

这一张谈谈我对协程的理解。

协程是一种轻量级的，由应用自行管理的并发方式，在Go中通过关键词`go`实现。

## Let's 'go'

Go程序启动时，会有一个goroutine执行main函数。在每一个goroutine中，都可以通过`go`关键词创建一个新的goroutine。在main结束执行时，所有goroutine都会被包里杀死。

`go`关键词后面必须跟随一个函数调用。普通的函数调用中，调用者必须等待被调用的函数返回。而被通过`go`创建的函数调用则不需要。

当然，有时候我们也需要调用者等待被创建的goroutine。最直观的方法是`sync`包中的`WaitGroup`结构体。

```go
var group sync.WaitGroup	// Go语言会自行赋予零值
fmt.Println("Launching")
fmt.Println("You have to wait for me.")    // 立刻调用，等待返回
for i, v := range []int{3, 1, 4, 1, 5, 9} {
    i := i
    v := v
    group.Add(1)	// 需要等待的任务数量 + 1
    go func () {
        fmt.Printf("[%d]: %d\n", i, v)
        group.Done()	// 需要等待的任务数量 - 1
    }()    // 立即调用，当前goroutine继续执行
}
fmt.Println("Waiting")
group.Wait()	// 等待直到任务数为0
fmt.Println("Done")
```

上面的程序还能继续改进，可以在goroutine中用`defer`关键词保证group.Done被执行：

```go
var group sync.WaitGroup	// Go语言会自行赋予零值
fmt.Println("Launching")
fmt.Println("You have to wait for me.")    // 立刻调用，等待返回
for i, v := range []int{3, 1, 4, 1, 5, 9} {
    i := i
    v := v
    group.Add(1)	// 需要等待的任务数量 + 1
    go func () {
    	defer group.Done()	// 需要等待的任务数量 - 1
        fmt.Printf("[%d]: %d\n", i, v)
    }()    // 立即调用，当前goroutine继续执行
}
fmt.Println("Waiting")
group.Wait()	// 等待直到任务数为0
fmt.Println("Done")
```

## 地道战

我们总是会想要一种方法可以在goroutine之间传递数据，Go语言提供了`挖地道`的方法 —— 通道channel。

下面的代码中存在着4个goroutine：main, counter, square以及printer：

```go
counter := func(out chan<- int, nums []int) {
	for _, v := range nums {
		fmt.Printf("SENT: %d\n", v)
		out <- v
		time.Sleep(1 * time.Second)
	}
}

square := func(in <-chan int, out chan<- int) {
	for {
		num := <-in
		result := num * num
		fmt.Printf("SQUARE: %d -> %d\n", num, result)
		out <- result
	}
}

printer := func(in <-chan int, wg *sync.WaitGroup) {
	for {
		num := <-in
		fmt.Printf("FINAL: %d\n", num)
		wg.Done()
	}
}

nums := []int{3, 1, 4, 1, 5, 9, 2, 6}
sources := make(chan int)
squares := make(chan int, 3)
var wg sync.WaitGroup
wg.Add(len(nums))

go counter(sources, nums)
go square(sources, squares)
go printer(squares, &wg)

wg.Wait()
fmt.Println("Done")
```

其中counter, square以及printer通过channel交换数据：counter产生一个整型，square获取它并作平方运算，printer获取被平方的数字并打印。main则通过sync.WaitGroup保证前面的工作流能完成。它大概打印出这样的内容：

```plain
SENT: 3
SQUARE: 3 -> 9
FINAL: 9
SENT: 1
SQUARE: 1 -> 1
FINAL: 1
SENT: 4
SQUARE: 4 -> 16
FINAL: 16
SENT: 1
SQUARE: 1 -> 1
FINAL: 1
SENT: 5
SQUARE: 5 -> 25
FINAL: 25
SENT: 9
SQUARE: 9 -> 81
FINAL: 81
SENT: 2
SQUARE: 2 -> 4
FINAL: 4
SENT: 6
SQUARE: 6 -> 36
FINAL: 36
Done
```

### 单向通道

在函数签名中，我们使用了`chan<- int`和`<-chan int`这两种特殊的通道，它们被用来约束这个参数只能存入或是取出。

### 同步通道

这里我们使用到的`sources`没有指定长度，因此它也被称为`同步通道`，发送方会在发送通道中的数据未被取出时阻塞，直到接收方取走这个数据。反过来，如果通道是空的，接收方也将阻塞，直到发送方放入一个数据。

### 缓冲通道

我们为`squares`指定了长度3，这使得拥有了缓冲空间，因此被称为`缓冲通道`。发送方只在通道的缓冲空间满时阻塞。

编写程序时需要严格考虑缓冲区的长度：是否存在多个发送者，发送者和接收者处理数据的速度差，性能要求等等都应该纳入考量。

## 并行循环

> 如果没有特殊说明，本节内容以Go 1.22以前的版本为准
> 本节的部分问题在Go 1.22已经修复，这里仅作为旧版本的参考

在[更具Go味的程序](002-the-go-way.html)一章中，我们已经提到了在循环中并发会遇到的变量捕获问题：

```go
for _, v := range []int{1, 2, 3} {
	go fmt.Printf("%d\t", v)
}
fmt.Println("")
```

这段代码将重复打印`3`。这是因为，goroutine捕获到的变量v会随着循环而改变，一个常见的修复方式为：把v作为参数传给goroutine

```go
for _, v := range []int{1, 2, 3} {
	go func(value int) {
		fmt.Printf("%d\t", value)
	}(v)
}
fmt.Println("")
```

上述方法能够生效，是因为每次创建goroutine时的参数是立即求值的，它不会受循环的影响。

另一种常见做法在内部重新声明一个同名变量：

```go
for _, v := range []int{1, 2, 3} {
	go func() {
		v := v
		fmt.Printf("%d\t", v)
	}()
}
fmt.Println("")
```

### 等待并发完成

我们常常希望当前goroutine会等待循环中的goroutine运行完成。我们可以用通道或是sync.WaitGroup来实现这个过程。在前面已经见过很多次了，因此不在这里赘述。

## 约束同时执行的goroutine的数量

系统的资源是有限的，有时候可能需要约束同时执行的goroutine的数量。我们可以通过约束创建的goroutine的数量来做到这一点，但计算goroutine的数量可能并不是很直观，因此我们也可以通过通道来实现这一点：

```go
tokens := make(chan struct{}, 20)

for i := range 100 {
	// 获取token
	tokens<- struct{}{}
	fmt.Printf("我是一个费时且占用资源的任务%d\n", i)
	// 归还token
	<-tokens
}
```

这段程序中，我们把通道的缓冲区的空闲空间视作通行证，每个goroutine都需要获取令牌才能执行，并且必须在完成任务后归还令牌。借助缓冲通道的特性，这样可以将同时执行的goroutine数量约束在20个以内。

> 这段代码中使用的`for i := range 100`同样是从Go 1.22起才有的特性，它会遍历$[0, 100)$共100个整数。

## 通道与多路复用

有时候，一个goroutine可能需要同时从多个通道中获取数据：

```go
num1 := make(chan int)
num2 := make(chan int)
num3 := make(chan int)	

generator := func(out chan<- int, nums []int) {
	for _, v := range nums {
		out <- v
	}
}	

go generator(num1, []int{1, 2, 3})
go generator(num2, []int{11, 12, 13})
go generator(num3, []int{21, 22, 23})

for _ := range 3 {
	x := <-num1
	fmt.Printf("%d\t", x)
}
for _ := range 3 {
	x := <-num2
	fmt.Printf("%d\t", x)
}
for _ := range 3 {
	x := <-num3
	fmt.Printf("%d\t", x)
}
fmt.Println()
```

上述代码段的问题时，它总是需要等待num1发送完数据才能继续，也就是说num2和num3长期处于阻塞状态。

Go语言的select关键字有一种独特的用法 —— **多路复用**：

```go
num1 := make(chan int)
num2 := make(chan int)
num3 := make(chan int)

generator := func(out chan<- int, nums []int) {
	for _, v := range nums {
		out <- v
	}
}

go generator(num1, []int{1, 2, 3})
go generator(num2, []int{11, 12, 13})
go generator(num3, []int{21, 22, 23})

for _ = range 9 {
	select {
	case x := <-num1:
		fmt.Printf("%d\t", x)
	case x := <-num2:
		fmt.Printf("%d\t", x)
	case x := <-num3:
		fmt.Printf("%d\t", x)
	}
}

fmt.Println()
```

通过多路复用，程序从数个未阻塞的分支中随机选择一个执行，从而保证公平。

> 多路复用不仅适用于接收，也适用于发送。实际上，select是从“就绪”的分支里选择的，包括可以接收到数据的接收分支，可以发送数据的发送分支以及默认分支。

## 通道与终止goroutine

借助于多路复用，我们可以实现一个关闭goroutine的函数:

```go
var done = make(chan struct{})

func cancelled() bool {
	select {
	case <-done:
		return true
	default:
		return false
	}
}
```

> 我们要保证没有任何goroutine往done中发送数据

> 实际应用中可能需要根据实际需求修改

goroutine可以在开始执行任务前，调用`cancelled`判断任务是否已经被取消。当需要取消任务时，只需要`close(done)`即可。

这是因为，当`done`未被关闭时，`<-done`未就绪，因此多路复用进入默认分支，返回false，表示任务未结束。当`done`被关闭后，`<-done`总是返回零值，因此`<-done`总是就绪，故而返回true，表示任务已结束。

因为go语言自身的特性，操作chan是天然并发安全的，因此不需要加入互斥锁等操作。
