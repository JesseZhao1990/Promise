# Promise
手写一个PromiseA+的实现

### 1. 最简单的基本功能

```
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
```
### 2.链式调用
```
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
```

### 3. 异步

```
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

```

### 4. 状态机制

```
/**
 * 先看一下前一个例子存在的问题
 * 1.前一个例子还存在一些问题，如果Promise异步操作已经成功，在这之前注册的所有回调都会执行，
 * 但是在这之后再注册的回调函数就再也不执行了。具体的运行下面这段代码，可以看到“can i invoke”并没有打印出来
 * 想要解决这个问题，我们就需要加入状态机制了。具体实现看本文件夹下的另一个js文件里的代码。
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
},0)

```

```
/**
 * 在promise01.js中，我们已经分析了，我们需要加入状态机制
 * 在这里实现一下PromiseA+中关于状态的规范。
 * 
 * Promises/A+规范中的2.1Promise States中明确规定了，pending可以转化为fulfilled或rejected并且只能转化一次，
 * 也就是说如果pending转化到fulfilled状态，那么就不能再转化到rejected。
 * 并且fulfilled和rejected状态只能由pending转化而来，两者之间不能互相转换
 * 
 */
function Promise(fn){
  var status = 'pending'
  var value= null;
  var callbacks = [];
  this.then = function(onFulfilled) {
    // 如果是pending状态，则加入到注册队列中去。
    if(status === 'pending'){
      callbacks.push({f:onFulfilled});
      return this;
    }
    // 如果是fulfilled 状态，此时直接执行传入的注册函数即可。
    onFulfilled(value);
    return this;
  }

  function resolve(newValue){
    value = newValue;
    status = 'fulfilled';
    setTimeout(function(){
        callbacks.map(function(cb,index){
          if(index === 0){
            callbacks[index].value = newValue;
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

```


```
/**
 * 刚才的例子中，确实打印出了 can i invoke，但是之前then的注册函数的返回值，并没有打印出来。
 * 也就是说 1 和 2 并没有被打印出来，看下面的注释
 * 
 */
function Promise(fn){
  var status = 'pending'
  var value= null;
  var callbacks = [];
  this.then = function(onFulfilled) {

    if(status === 'pending'){
      callbacks.push({f:onFulfilled});
      return this;
    }

    onFulfilled(value);
    return this;
  }

  function resolve(newValue){
    value = newValue;
    status = 'fulfilled';
    setTimeout(function(){
        callbacks.map(function(cb,index){
          if(index === 0){
            callbacks[index].value = newValue;
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

var p = new Promise(function(resolve){
    resolve('aaaaaa')
})

p.then(function(response){
  console.log(response);    
  return 1;
}).then(function(response){
  console.log(response);  // 这里应该打印的是45行返回的1，但是打印出来的确是aaaaaa
  return 2;  
}).then(function(response){
  console.log(response); // 这里应该打印的是48行返回的2，但是打印出来的确是aaaaaa
})

setTimeout(function(){
   p.then(function(response){
     console.log('can i invoke?');
   })
},1000)


/**
 * 问题的根源在于什么呢？
 * 问题的根源是每次的then的返回值都是p，当状态是fulfilled，执行的是onFulfilled(value)
 * 此处的value是p的value，也就是fulfilled状态的value。根据规范，promise应该是只能发射单值。
 * 而我们设计了一个callback堆栈中有一系列的值。生生的把promise变成了多值发射。
 * 
 * 所以，调整思路，每个then都应该返回一个promise，这个promise应该是一个全新的promise。
 * 具体实现见下一个例子。
 */
```


```
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
```



```
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

```


### 5.处理注册的函数返回值是promise的情况

```
/**
 * 不出意料，又要抛出问题了。当then注册的回调函数返回的是promise的时候，从这个then之后的所有then的注册函数
 * 都应该注册在新返回的promise上。直到遇到下一个回调函数的返回值也是promise。
 * 
 * 实现思路：
 * 在handle中判断注册函数返回的是否是promise。如果是的话,则resolve这个返回的promise的值，具体代码看一下36到38行
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
  var promise = new Promise(function(resolve){
    function handle(value){
      var res = typeof onFulfilled === 'function'?  onFulfilled(value) : value;
      if(res instanceof Promise){
        promise = res;
        resolve(res.value);
      }else {
        resolve(res);
      }
    }
    if(self.status==='pending'){
      self.callbacks.push(handle);
    }else if(self.status ==='fulfilled'){
      handle(self.value);
    }
  })
  return promise;
}

// 使用
var p = new Promise(function(resolve){
    resolve('这是响应的数据')
})

p.then(function(response){
  console.log(response);
  return new Promise(function(resolve){
    resolve('testtest')
  })
}).then(function(response){
  console.log(response);
  return 2;  
}).then(function(response){
  console.log(response);
})

setTimeout(function(){
   p.then(function(response){
     console.log('can i invoke?');
     return new Promise(function(resolve){
        resolve('hhhhhh')
      })
   }).then(function(response){
     console.log(response);
   })
},1000)

```

### 另一种更优雅的实现
```
function Promise(fn){
  var value = null;
  var state = 'pending';
  var deferreds = [];

  this.then = function(onFulfilled){
    return new Promise(function(resolve){
      handle({
        onFulfilled:onFulfilled,
        resolve: resolve
      })
    });  
  }

  /**
   * 添加或者使用deferred
   * @param deferred 
   */
  function handle(deferred){
    if(state === 'pending'){
      deferreds.push(deferred);
      return;
    }

    let res = deferred.onFulfilled(value);
    deferred.resolve(res);
  }

  /**
   * resolve函数
   * @param newValue 
   */
  function resolve(newValue){
    if(newValue instanceof Promise){
      newValue.then(resolve)
      return;
    }
    setTimeout(function(){
      value = newValue;
      state = 'fulfilled';
      deferreds.forEach(deferred =>handle(deferred));
    },0)
  }

  fn(resolve);

}



let p1 = new Promise(function(resolve){
  setTimeout(()=>{resolve('000')},2000);
})

p1.then(function(v){
  console.log(v);
})
.then(function(v){
  console.log(v);
})
.then(function(v){
  console.log(v);
  return new Promise(function(resolve){
    setTimeout(()=>{resolve('111')},4000)
  })
})
.then(function(v){
  console.log(v);
})
```

加上reject状态
```
function Promise(fn){
  var value = null;
  var state = 'pending';
  var deferreds = [];

  this.then = function(onFulfilled,onRejected){
    return new Promise(function(resolve){
      handle({
        onFulfilled:onFulfilled || null,
        onRejected:onRejected || null,
        resolve: resolve,
        reject:reject
      })
    });  
  }

  /**
   * 添加或者使用deferred
   * @param deferred 
   */
  function handle(deferred){
    if(state === 'pending'){
      deferreds.push(deferred);
      return;
    }

    let cb = state === 'fulfilled' ? deferred.onFulfilled : deferred.onRejected;

    if(cb === null){
      cb = state === 'fulfilled' ? deferred.resolve : deferred.reject;
      cb(value);
      return;
    }
    
    let res = cb(value);
    deferred.resolve(res);
  }

  /**
   * resolve函数
   * @param newValue 
   */
  function resolve(newValue){
    if(newValue instanceof Promise){
      newValue.then(resolve,reject)
      return;
    }
    value = newValue;
    state = 'fulfilled';
    setTimeout(function(){
      deferreds.forEach(deferred =>handle(deferred));
    },0)
  }


  function reject(newValue){
    value = newValue;
    state = 'rejected';
    setTimeout(function(){
      deferreds.forEach(deferred =>handle(deferred));
    })
  }

  fn(resolve,reject);

}



let p1 = new Promise(function(resolve,reject){
  setTimeout(()=>{reject('000')},2000);
})

p1.then(function(v){
  console.log(v);
},function(error){
  console.log(error);
})
.then(function(v){
  console.log(v);
})
.then(function(v){
  console.log(v);
  return new Promise(function(resolve,reject){
    setTimeout(()=>{reject('111')},4000)
  })
})
.then(function(v){
  console.log(v);
},function(error){
  console.log(error);
})
```
