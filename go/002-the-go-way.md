---
outline: deep
---

# 更具Go味的程序

这篇文章记载了一些Go语言中，在其他语言里不太常见的特性。文章中的代码和运行结果是通过`gophernotes`运行的。

## 多返回值

Go语言的函数可以返回多个值：

```go
func repeat(a int) (int, int, int) {
    return a, a, a
}
fmt.Println(repeat(1))
```

这将打印`1 1 1`。

## 返回错误

在类似于Java、TypeScript等语言中，通常使用`异常`来表示错误。但在Go语言中，错误被作为返回值显式的返回给调用者：

```go
func divide(a, b int) (int, error) {
    if b == 0 {
        return 0, fmt.Errorf("divided by zero")
    }
    return a / b, nil
}
fmt.Println(divide(2, 2))
fmt.Println(divide(2, 0))
```

这将会打印：

```plain
1 <nil>
0 divided by zero
```

## 延迟执行defer

`defer`是一个不太常见的关键字，他会延迟执行紧跟着的函数调用：

```go
func DeferTest() {
    fmt.Println("1")
    defer fmt.Println("3")
    fmt.Println("2")
}
DeferTest()
```

它会打印：

```go
1
2
3
```

`defer`的执行是后进先出的，因此：

```go
for i := 0; i < 3; i++ {
    defer fmt.Println(i)
}
```

会打印：

```go
2
1
0
```

从上面的例子中可以看出，defer中调用函数使用的参数是立刻求值的。

## Let's 'go'!

`go`是Go语言的一个特色关键字，他会创建一个goroutine并发执行其他任务：

```go
var wg sync.WaitGroup
for i := range []int{1, 2, 3} {
    wg.Add(1)
    go func() {
        fmt.Println(i)
        wg.Done()
    }()
}
wg.Wait()
```

因为我是用的gophernotes中的Go版本较低，他会打印:

```go
3
3
3
```

这个问题源自Go语言的for循环对循环变量的处理，因此在defer语句中也存在类似的问题。

好在从Go 1.22开始，它能正确地打印1, 2以及3, 但是我们无法预测他们的顺序，因为我们无法预测哪个goroutine快一点。

你也可以把i作为参数传给goroutine来保证不会错：

```go
var wg sync.WaitGroup
for _, v := range []int{1, 2, 3} {
    wg.Add(1)
    go func(val int) {
        fmt.Println(val)
        wg.Done()
    }(v)
}
wg.Wait()
```

## “鸭子类型”

> 一个东西叫起来像鸭子，走起来像鸭子，游起来像鸭子，那他就是鸭子

很多语言都有接口的概念，Go也不例外。不同的是，Go中的接口是隐式实现的，不需要手动指定一个类实现了某个接口，下面是一个例子：

```Go
// 定义一个Speaker接口，它里面只有Speak一个方法，返回一个字符串
type Speaker interface {
    Speak() string
}

// 定义两种动物
type Cat struct {}
type Dog struct {}

// 这两种动物都会Speak
func (c Cat) Speak() string {
    return "Meow"
}
func (d Dog) Speak() string {
    return "Bark"
}

// 接口可以用在函数的参数列表里作为参数类型
func WhatDoesItSay(it Speaker) {
    fmt.Printf("It says '%s'\n", it.Speak())
}
```

尽管我们没有显式地为Cat和Dog实现一个接口（比如在Java里通常会class Cat implements Speaker），它们还是隐式地完成了这一步。实际上，Go编译器为我们完成了检查的工作。

所以，我们可以这样调用这个函数：

```go
cat := Cat{}
dog := Dog{}

WhatDoesItSay(cat)
WhatDoesItSay(dog)
```

它会打印下面的内容：

```plain
It says 'Meow'
It says 'Bark'
```

严格来说，Go的接口并不是动态的鸭子类型，整个匹配的过程是在**编译期**完成的，因此我给标题的鸭子类型加了引号。
