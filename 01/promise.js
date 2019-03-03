/**
 * 定义Promise
 * 先实现一个最简单的。用setTimeout模拟一个异步的请求。
 */
function MyPromise(fn){
  var value= null;
  var deferreds = [];
  this.then = function(onFulfilled) {
    deferreds.push(onFulfilled);
  }

  function resolve(value){
    deferreds.forEach(function(deferred){
      deferred(value);
    })
  }

  fn(resolve);
}


// 使用MyPromise
var p = new MyPromise(function(resolve){
  setTimeout(function(){
    resolve('这是响应的数据')
  },2000)
})

p.then(function(response){
  console.log(response);
})