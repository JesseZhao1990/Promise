/**
 * 定义Promise
 * 先实现一个最简单的。用setTimeout模拟一个异步的请求。
 */
function Promise(fn){
  var value= null;
  var callbacks = [];
  this.then = function(onFulfilled) {
    callbacks.push(onFulfilled);
  }

  function resolve(value){
    callbacks.forEach(function(cb){
      cb(value);
    })
  }

  fn(resolve);
}


// 使用Promise
var p = new Promise(function(resolve){
  setTimeout(function(){
    resolve('这是响应的数据')
  },2000)
})

p.then(function(response){
  console.log(response);
})