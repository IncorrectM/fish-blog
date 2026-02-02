---
outline: deep
---

# Go的初印象

最近在快速阅读《Go程序设计语言》，这篇文章记录的是我在前几章中对 Go 语法的第一层印象。

## Hello World

这是一个最小的Go程序

```go
package main

import "fmt"

func main() {
	fmt.Println("hello world")
}
```

## 声明变量

Go语言有多种声明变量的方法，下面三行的结果是一样的。

```go
var str string
var str = ""	// 自动推导类型
str := ""	// 最简化语句
```

Go语言保证声明的变量总是可用的，为此会自动初始化变量的值为零值。

## 数组和切片

数组是一个很常见的数据结构，它包含了数个相同类型的数据。

```go
nums := [2]int{1, 2}
```

数组是固定长度的，**长度是类型的一部分**，因此`[2]int`和`[3]int`不是同一个类型。

相比于数组，切片(slice)在Go程序中更加常见:

```go
nums := []int{1, 2}
```

和数组相比，切片是没有固定长度的，可以通过`append`向切片末尾增加新的元素，通过`len`获得它的长度，通过`cap`获得它的容积:

```go
nums := []int{1, 2}
fmt.Println(len(nums))
nums = append(nums, 1)
fmt.Println(len(nums))
```

Go语言会自行管理切片的数据、长度和容积。

无论是数组还是切片，都可以通过下标访问里面的元素，和大多数语言一样，下标是从0开始的:

```go
numsSlice := []int{1, 2}
numsArray := [2]int{3, 4}
fmt.Println(numsSlice[0], numsArray[0])
```

## 条件语句if

Go里面的if语句就是常见的if语句，不过它不用加括号。

```go
isOk := true
if isOk {
	fmt.Println("It's okay!")
} else {
	fmt.Println("It's not okay QAQ")
}
```

## 循环语句

Go中只有`for`一个循环关键字，但可以被写为多种形式。

### 完整形式的循环

最基本的循环包括初始化（i := 0）、条件判断（i < 10）和自增（i++）语句。

```go
for i := 0; i < 10; i++ {
	fmt.Printf("i=%d\n", i)
}
```

### 省略初始化

如果使用已经初始化的变量，可以省略初始化语句。

```go
// 在外面某个地方初始化
i := 0
// 做了其他事情
for ; i < 10; i++ {
	fmt.Println(i)
}
```

### 省略自增

你可以把复杂的自增逻辑写到for循环内部

```go
for i := 0; i < 10; {
	fmt.Println(i)
	// 一个"复杂"的自增逻辑
	if i > 5 {
		i += 2
	} else {
		i++
	}
}
```

### 退化为while循环

Go没有while循环，但是可以省略初始化语句和自增语句，此时for循环相当于while循环：

```go
i := 0
for i < 10 {
	fmt.Println(i)
	i++
}
```

### 无限循环

有时候可能需要无限循环。

```go
for {
	fmt.Println("looping...")
}
```

### 遍历切片

Go常使用`range`关键字进行遍历：

```go
nums := []int{1, 2, 3}

for index, value := range nums {
	fmt.Println(index, value)
}
```

如果只要值：

```go
nums := []int{1, 2, 3}

for _, value := range nums {
	fmt.Println(value)
}
```

如果只要索引：

```go
nums := []int{1, 2, 3}

for index := range nums {
	fmt.Println(index)
}
```

在Go 1.22中，引入了对整数的`range`支持：

```go
for i := range 7 {
	fmt.Println(i)
}
```

这会打印0到6共7行，等价于:

```go
for i := 0; i < 7; i++ {
	fmt.Println(i)
}
```

Go 的 for 语法并不复杂，但非常统一 —— 只有一个关键字，却覆盖了传统 for、while、无限循环和范围遍历。

这种设计体现了Go语言某种“若无必要，勿增实体”的克制：不增加新的关键字，而是让已有结构承担更多角色。

## 声明函数

Go语言使用`func`关键字声明函数：

```go
func add(a int, b int) int {
	return a + b
}
```

基本结构为：

```plain
func 函数名(参数列表) 返回值类型 {
  函数体
}
```

其中参数列表包括数个`参数名 参数类型`的对子。对于上面这个例子，可以稍作省略，把相同类型的参数写到一起，只写一次参数类型，从而能更加简洁：

```go
func add(a, b int) int {
	return a + b
}
```
