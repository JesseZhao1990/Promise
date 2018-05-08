/**
 * 根据刚才的分析，我们重新优化一下代码
 * 1.把私有属性挂到实例上去
 * 2.把公共方法挂到构造函数的原型上去
 *
 */
function Promise(fn){
  this.status = 'pending';
  this.value= null;
  this.callbacks = [];
  var self = this;
  function resolve(newValue){
    self.value = newValue;
    self.status = 'fulfilled';
    setTimeout(function(){
      self.callbacks.map(function(cb){
          cb(value);
        })
    },0)
  }
  fn(resolve);
}


Promise.prototype = Object.create(null);
Promise.prototype.constructor = Promise;


Promise.prototype.then = function(onFulfilled){
  var self = this;
  return new Promise(function(resolve){
    function handle(value){
      var res = typeof onFulfilled === 'function'?  onFulfilled(value) : value;
      resolve(res);
    }
    if(self.status==='pending'){
      self.callbacks.push(handle);
    }else if(self.status ==='fulfilled'){
      handle(self.value);
    }
  })
}

// 使用
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

setTimeout(function(){
   p.then(function(response){
     console.log('can i invoke?');
   })
},1000)