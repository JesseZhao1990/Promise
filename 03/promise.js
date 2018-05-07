/**
 * 先看一下前一个例子存在的问题
 * 1. 如果在then方法注册回调之前，resolve函数就执行了，怎么办？比如 new Promise的时候传入的函数是同步函数的话，
 * then还没被注册，resolve就执行了。。这在PromiseA+规范中是不允许的，规范明确要求回调需要通过异步的方式执行。
 * 用来保证一致可靠的执行顺序。
 * 
 * 因此我们需要加入一些处理。把resolve里的代码放到异步队列中去。这里我们利用setTimeout来实现。
 * 原理就是通过setTimeout机制，将resolve中执行回调的逻辑放置到JS任务队列末尾，以保证在resolve执行时，
 * then方法的回调函数已经注册完成
 * 
 */
function Promise(fn){
  var value= null;
  var callbacks = [];
  this.then = function(onFulfilled) {
    callbacks.push({f:onFulfilled});
    return this;
  }

  function resolve(value){
    setTimeout(function(){
        callbacks.map(function(cb,index){
          if(index === 0){
            callbacks[index].value = value;
          }
          var rsp = cb.f(cb.value);
          if(typeof callbacks[index+1] !== 'undefined'){
            callbacks[index+1].value = rsp;
          }
        })
    },0)
  }
  fn(resolve);
}


// 使用Promise,现在即使是同步的立马resolve，也能正常运行了。
var p = new Promise(function(resolve){
    resolve('这是响应的数据')
})

p.then(function(response){
  console.log(response);
  return 1;
}).then(function(response){
  console.log(response);
  return 2;  
}).then(function(response){
  console.log(response);
})