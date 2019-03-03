/**
 * 延时机制
 * 如果promise是同步代码，resolve会先于then执行，这时deferreds队列还是空的，还有一个问题是, 后续的注册的回调函数再也不会被执行了
 * 可以在控制台里观察一下这种现象
 */

var p1 = new MyPromise(function(resolve){
  resolve('响应的数据')
})

p1.then(function(response){
  console.log(response);   // 这一行永远不会被打印出来，想一下为什么？
})


// 加入延时机制，来重新定义MyPromise (我们用setTimeout来模拟，setTimeout是macroTask，真正的promise的延时是一个microTask)

function MyPromise(fn){
  var value= null;
  var deferreds = [];
  this.then = function(onFulfilled) {
    deferreds.push(onFulfilled);
  }

  function resolve(value){
    setTimeout(function(){
      deferreds.forEach(function(deferred){
        deferred(value);
      })
    },0)
  }

  fn(resolve);
}

// 此时，我们再次使用一下我们定义的MyPromise，来执行一下同步代码
var p1 = new MyPromise(function(resolve){
  resolve('响应的数据')
})

p1.then(function(response){
  console.log(response);   // 竟然打印出来了
})

// 到此，我们设计出了延时机制的promise