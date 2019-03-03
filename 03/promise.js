/**
 * 状态机制
 * 如果 Promise 异步操作已经成功，之后调用 then 注册的回调再也不会执行了
 */

var p1 = new MyPromise(function(resolve){
  resolve('响应的数据')
})

p1.then(function(response){
  console.log(response);   // 此处能打印出来
})

setTimeout(()=>{
  p1.then((response)=>{
    console.log(response) // 此处没有被打印出来，为什么？
  })
},)


// 由于promise异步操作已经完成，之后调用的then方法往deferreds里加入的回调函数都没有机会执行，
// 为了解决这个问题，需要引入规范中所说的 states，即每个 Promise 存在三个互斥状态：pending（等待状态）、fulfilled（成功态）、rejected（失败态）
// 基于此，我们重新设计MyPromise

function MyPromise(fn){
  var value= null;
  var status = 'pending';  // 加入状态的字段
  var deferreds = [];
  this.then = function(onFulfilled) {
    if(status === 'pending'){ // 加入状态的判断，如果状态是fullfilled态，则直接执行回调
      deferreds.push(onFulfilled);
    }else{
      onFulfilled(value)
    }
  }

  function resolve(v){
    setTimeout(function(){
      value = v;
      status = 'fulfilled'  // 执行resolve的时候，把状态变成fulfilled态
      deferreds.forEach(function(deferred){
        deferred(value);
      })
    },0)
  }

  fn(resolve);
}


// 我们使用我们改进后的promise，再次运行刚刚的这段代码。我们发现。之后调用 then 注册的回调再也执行了
var p1 = new MyPromise(function(resolve){
  resolve('响应的数据')
})

p1.then(function(response){
  console.log(response);   // 此处能打印出来
})

setTimeout(()=>{
  p1.then((response)=>{
    console.log(response) // 此处这次被打印出来了
  })
},)