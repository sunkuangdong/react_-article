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