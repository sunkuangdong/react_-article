# 关于 Hooks
## Hooks理念 从Logo聊起
React Logo 的图案是代表原子（atom）的符号。世间万物由原子组成，原子的类型与属性决定了事物的外观与表现。

同样，在React中，我们可以将UI拆分为很多独立的单元，每个单元被称为Component。这些Component的属性与类型决定了UI的外观与表现。

讽刺的是，原子在希腊语中的意思为不可分割的（indivisible），但随后科学家在原子中发现了更小的粒子 —— 电子（electron）。电子可以很好的解释原子是如何工作的。

在React中，我们可以说ClassComponent是一类原子。

但对于Hooks来说，与其说是一类原子，不如说他是更贴近事物运行规律的电子。

我们知道，React的架构遵循schedule - render - commit的运行流程，这个流程是React世界最底层的运行规律。

ClassComponent作为React世界的原子，他的生命周期（componentWillXXX/componentDidXXX）是为了介入React的运行流程而实现的更上层抽象，这么做是为了方便框架使用者更容易上手。

相比于ClassComponent的更上层抽象，Hooks则更贴近React内部运行的各种概念（state | context | life-cycle）。

作为使用React技术栈的开发者，当我们初次学习Hooks时，不管是官方文档还是身边有经验的同事，总会拿ClassComponent的生命周期来类比Hooks API的执行时机。

这固然是很好的上手方式，但是当我们熟练运用Hooks时，就会发现，这两者的概念有很多割裂感，并不是同一抽象层次可以互相替代的概念。

比如：替代componentWillReceiveProps的Hooks是什么呢？

可能有些同学会回答，是useEffect：
```
useEffect( () => {
    console.log('something updated');
}, [props.something])
```

但是componentWillReceiveProps是在render阶段执行，而useEffect是在commit阶段完成渲染后异步执行。

这篇文章可以帮你更好理解componentWillReceiveProps：深入源码剖析componentWillXXX为什么UNSAFE(opens new window)

所以，从源码运行规律的角度看待Hooks，可能是更好的角度。这也是为什么上文说Hooks是React世界的电子而不是原子的原因。

## 总结

Concurrent Mode是React未来的发展方向，而Hooks是能够最大限度发挥Concurrent Mode潜力的Component构建方式。

正如Dan在React Conf 2018演讲结尾所说：你可以从React的LOGO中看到这些围绕着核心的电子飞行轨道，Hooks可能一直就在其中。