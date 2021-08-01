# 实现极简 Hooks
## 工作原理
对于useState Hook，考虑如下例子：
```
function App() {
  const [num, updateNum] = useState(0);

  return <p onClick={() => updateNum(num => num + 1)}>{num}</p>;
}
```

可以将工作分为两部分：

1. 通过一些途径产生更新，更新会造成组件render。

2. 组件render时useState返回的num为更新后的结果。

其中步骤1的更新可以分为mount和update：

1. 调用ReactDOM.render会产生mount的更新，更新内容为useState的initialValue（即0）。

2. 点击p标签触发updateNum会产生一次update的更新，更新内容为num => num + 1。

接下来讲解这两个步骤如何实现。

## 更新是什么
首先我们要明确更新是什么。

在我们的极简例子中，更新就是如下数据结构：

```
const update = {
  // 更新执行的函数
  action,
  // 与同一个Hook的其他更新形成链表
  next: null
}
```
对于App来说，点击p标签产生的update的action为num => num + 1。

如果我们改写下App的onClick：

```
// 之前
return <p onClick={() => updateNum(num => num + 1)}>{num}</p>;

// 之后
return <p onClick={() => {
  updateNum(num => num + 1);
  updateNum(num => num + 1);
  updateNum(num => num + 1);
}}>{num}</p>;
```
那么点击p标签会产生三个update。

## update数据结构
这些update会形成环状单向链表。

调用updateNum实际调用的是dispatchAction.bind(null, hook.queue)，我们先来了解下这个函数：

```
function dispatchAction(queue, action) {
  // 创建update
  const update = {
    action,
    next: null
  }

  // 环状单向链表操作
  if (queue.pending === null) {
    update.next = update;
  } else {
    update.next = queue.pending.next;
    queue.pending.next = update;
  }
  queue.pending = update;

  // 模拟React开始调度更新
  schedule();
}
```
环状链表操作不太容易理解，这里我们详细讲解下。

当产生第一个update（我们叫他u0），此时queue.pending === null。

update.next = update;即u0.next = u0，他会和自己首尾相连形成单向环状链表。

然后queue.pending = update;即queue.pending = u0

```
queue.pending = u0 ---> u0
                ^       |
                |       |
                ---------
```
当产生第二个update（我们叫他u1），update.next = queue.pending.next;，此时queue.pending.next === u0， 即u1.next = u0。

queue.pending.next = update;，即u0.next = u1。

然后queue.pending = update;即queue.pending = u1

```
queue.pending = u1 ---> u0   
                ^       |
                |       |
                ---------
```

你可以照着这个例子模拟插入多个update的情况，会发现queue.pending始终指向最后一个插入的update。

这样做的好处是，当我们要遍历update时，queue.pending.next指向第一个插入的update。

## 状态如何保存
现在我们知道，更新产生的update对象会保存在queue中。

不同于ClassComponent的实例可以存储数据，对于FunctionComponent，queue存储在哪里呢？

答案是：FunctionComponent对应的fiber中。

我们使用如下精简的fiber结构：

```
// App组件对应的fiber对象
const fiber = {
  // 保存该FunctionComponent对应的Hooks链表
  memoizedState: null,
  // 指向App函数
  stateNode: App
};
```
## Hook数据结构
接下来我们关注fiber.memoizedState中保存的Hook的数据结构。

可以看到，Hook与update类似，都通过链表连接。不过Hook是无环的单向链表。

```
hook = {
  // 保存update的queue，即上文介绍的queue
  queue: {
    pending: null
  },
  // 保存hook对应的state
  memoizedState: initialState,
  // 与下一个Hook连接形成单向无环链表
  next: null
}
```
## 模拟React调度更新流程

在上文dispatchAction末尾我们通过schedule方法模拟React调度更新流程。

```
function dispatchAction(queue, action) {
  // ...创建update
  
  // ...环状单向链表操作

  // 模拟React开始调度更新
  schedule();
}
```
现在我们来实现他。

我们用isMount变量指代是mount还是update。

```
// 首次render时是mount
isMount = true;

function schedule() {
  // 更新前将workInProgressHook重置为fiber保存的第一个Hook
  workInProgressHook = fiber.memoizedState;
  // 触发组件render
  fiber.stateNode();
  // 组件首次render为mount，以后再触发的更新为update
  isMount = false;
}
```
通过workInProgressHook变量指向当前正在工作的hook。

```
workInProgressHook = fiber.memoizedState;
```
在组件render时，每当遇到下一个useState，我们移动workInProgressHook的指针。

```
workInProgressHook = workInProgressHook.next;
```
这样，只要每次组件render时useState的调用顺序及数量保持一致，那么始终可以通过workInProgressHook找到当前useState对应的hook对象。

到此为止，我们已经完成第一步。

1. 通过一些途径产生更新，更新会造成组件render。

接下来实现第二步。

2. 组件render时useState返回的num为更新后的结果。
## 计算state
组件render时会调用useState，他的大体逻辑如下：

```
function useState(initialState) {
  // 当前useState使用的hook会被赋值该该变量
  let hook;

  if (isMount) {
    // ...mount时需要生成hook对象
  } else {
    // ...update时从workInProgressHook中取出该useState对应的hook
  }

  let baseState = hook.memoizedState;
  if (hook.queue.pending) {
    // ...根据queue.pending中保存的update更新state
  }
  hook.memoizedState = baseState;

  return [baseState, dispatchAction.bind(null, hook.queue)];
}
```
我们首先关注如何获取hook对象：

```
if (isMount) {
  // mount时为该useState生成hook
  hook = {
    queue: {
      pending: null
    },
    memoizedState: initialState,
    next: null
  }

  // 将hook插入fiber.memoizedState链表末尾
  if (!fiber.memoizedState) {
    fiber.memoizedState = hook;
  } else {
    workInProgressHook.next = hook;
  }
  // 移动workInProgressHook指针
  workInProgressHook = hook;
} else {
  // update时找到对应hook
  hook = workInProgressHook;
  // 移动workInProgressHook指针
  workInProgressHook = workInProgressHook.next;
}
```
当找到该useState对应的hook后，如果该hook.queue.pending不为空（即存在update），则更新其state。

```
// update执行前的初始state
let baseState = hook.memoizedState;

if (hook.queue.pending) {
  // 获取update环状单向链表中第一个update
  let firstUpdate = hook.queue.pending.next;

  do {
    // 执行update action
    const action = firstUpdate.action;
    baseState = action(baseState);
    firstUpdate = firstUpdate.next;

    // 最后一个update执行完后跳出循环
  } while (firstUpdate !== hook.queue.pending.next)

  // 清空queue.pending
  hook.queue.pending = null;
}

// 将update action执行完后的state作为memoizedState
hook.memoizedState = baseState;
```

