/**
 * 根据刚才的分析，我们重新优化一下代码
 * 1.去掉之前的多值设计
 * 2.每次的then 返回的都是一个全新的promise
 *
 */
function Promise(fn){
  var status = 'pending'
  var value= null;
  var callbacks = [];
  var self = this;

  this.then = function(onFulfilled) {
    return new Promise(function(resolve){
      function handle(value){
        var res = typeof onFulfilled === 'function' ? onFulfilled(value) : value;
        resolve(res);
      }
      // 如果是pending状态，则加入到注册队列中去。
      if(status === 'pending'){
        callbacks.push(handle);
      // 如果是fulfilled 状态。
      }else if(status === 'fulfilled'){
          handle(value);
      }
    })
  }

  function resolve(newValue){
    value = newValue;
    status = 'fulfilled';
    
    setTimeout(function(){
        callbacks.map(function(cb){
          cb(value);
        })
    },0)
  };

  fn(resolve);
}


// 
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



/**
 * 运行一下，完美输出
 * 先是输出“这是响应的数据”，然后是“1”，然后是“2”， 然后是“can i invoke?”
 * 
 * 接下来我们要好好整理一下代码了。把一些公用的方法放到构造函数的原型上去。改造之后的例子见下一个例子
 */