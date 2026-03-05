# PreCrawl

这是一个小型的Go服务，它通过一个无头浏览器访问SPA应用，返回渲染的HTML文本。

它将请求路径处理为可设置的目标URL，用无头浏览器打开，然后等待一个选择器对应的元素出现，然后休眠一会儿作为等待，最后施加HTML变换并返回HTML。

## 模块划分

### browser

这一模块包括了一个“浏览器池”，用来保存“页面上下文”这一大型对象，保证时间效率和空间效率。

*为什么不使用`sync.Pool`？*

`sync.Pool`适用于轻量级对象，且不保证对象不被回收。在PreCrawl中，每一个页面上下文对象都对应这无头浏览器中的一个页面，需要声明周期管理，如果对象被回收，可能导致程序失去对该页面的控制，导致页面停留在内存中，在成资源浪费。

PreCrawl使用了带缓冲的channel来保存数据，天然起到了限流的效果。

### config

这一模块包括了应用的设置项，对应config.yml文件。

### prerender

这一模块包括了实际渲染的工具类，它从浏览器池中取出一个页面，然后请求指定路径，等待元素出现，等待一段时间，最后返回HTML文本或错误。

### server

这一模块包括了实际的HTTP服务器。

服务器会发起数个worker goroutine，分别处理数据。

worker和处理请求的goroutine通过channel交互。

### task

这一模块包括了任务队列。

*为什么使用`sync.Cond`？*

在go社区中，一般推荐使用channel进行同步。

PreCrawl使用`sync.Cond`而不是channel来控制同步，是因为需要一个可变长的队列信息，且同时可能存在多个goroutine等待任务入队，使用`Broadcast()`支持一次唤醒多个goroutine.

### transformer

这一模块包括了系统中所有的HTML变换器。所有实现了接口`Transformer`的结构体都能作为变换器使用。
