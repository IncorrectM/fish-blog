# Redis与分布式锁

把传统多线程之间互斥访问的互斥锁，变成多个进程之间互斥访问的分布式锁。

`旅游商城`中没有使用，因此没有接触到深入的使用场景。

## setnx(set not exists)

利用Redis的`NX`机制：如果Set成功，则说明成功获取到锁；如果Set失败（获得nil），则说明没有获取到锁。

- 获取锁：`SET key value NX EX 100`
  - NX：Not eXists，只在key不存在时创建并SET，若已存在则返回nil
  - EX 100：设置过期时间100秒，避免一个进程永远拿着锁
- 释放锁：`DEL key`

## redission

`redission`是Java语言中常用的一个现成的分布式锁工具，它会在获得锁之后，生成一个watch dog自动为锁续期，释放锁要通知watch dog。

`redission`的锁是可重入的，但是只有同一线程的多次lock可以重入。
