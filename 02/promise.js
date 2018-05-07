/**
 * 先看一下前一个例子存在的问题
 * 1.在前一个例子中不断调用then需要支持链式调用，每次执行then都要返回调用对象本身。
 * 2.在前一个例子中，当链式调用的时候，每次then中的值都是同一个值，这是有问题的。其实第一次then中的返回值，应该是第二次调用then中的函数的参数，依次类推。
 * 所以，我们进一步优化一下代码。
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
    callbacks.map(function(cb,index){
      if(index === 0){
        callbacks[index].value = value;
      }
      var rsp = cb.f(cb.value);
      if(typeof callbacks[index+1] !== 'undefined'){
        callbacks[index+1].value = rsp;
      }
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
  return 1;
}).then(function(response){
  console.log(response);
  return 2;  
}).then(function(response){
  console.log(response);
})