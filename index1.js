// 是mount还是update
let ismount = true

// 模拟schedule
const schedule = () => {
    // 更新前将workInProgressHook重置为fiber保存的第一个hook
    workInProgressHook = fiber.memoizedState
    // 触发组件render
    fiber.setNode()
    // 改变状态，下次被触发就是update更新时
    ismount = true
}

/*
    initialState：默认值
*/ 
function useState(initialState) {
    let hook;
    // isMount：是否是update
    if (isMount) {
      // hook：链表
      hook = {
        queue: {
          pending: null
        },
        memoizedState: initialState,
        next: null
      }
      if (!fiber.memoizedState) {
        fiber.memoizedState = hook;
      } else {
        workInProgressHook.next = hook;
      }
      workInProgressHook = hook;
    } else {
      hook = workInProgressHook;
      workInProgressHook = workInProgressHook.next;
    }
  
    let baseState = hook.memoizedState;
    if (hook.queue.pending) {
      let firstUpdate = hook.queue.pending.next;
  
      do {
        const action = firstUpdate.action;
        baseState = action(baseState);
        firstUpdate = firstUpdate.next;
      } while (firstUpdate !== hook.queue.pending.next)
  
      hook.queue.pending = null;
    }
    hook.memoizedState = baseState;
  
    return [baseState, dispatchAction.bind(null, hook.queue)];
  }