const assert = require('assert');

const {updates,updateAt,ops,makePath,updateDeep,mapObj} = require('../src/index')

describe('updateAt', function() {

    const example = {
      name: 'Ben',
      age: 29,
      favourite:{
        color: 'blue'
      }
    }

    it('should immutably update the value at a key path, for a static value', () => {
      assert.deepEqual(
        updateAt(['favourite','color'], 'red')(example),
        {name:'Ben',age:29,favourite:{color:'red'}}
      )
    })

    it('should immutably transform the value at a key path, for a fn value', () => {
      const toUpperCase = (input) => input.toUpperCase()
      assert.deepEqual(
        updateAt(['favourite','color'], toUpperCase)(example),
        {name:'Ben',age:29,favourite:{color:'BLUE'}}
      )
    })

    it('should not change the object identity if no change has been made', () => {
      const identityFn = x => x
      assert.equal(
        updateAt(['favourite','color'], identityFn)(example),
        example
      )
    })

    it('should delete a key/value pair if provided a DELETE response', () => {
      assert.deepEqual(
        updateAt(['name'],ops.delete)(example),
        {age:29,favourite:{color:'blue'}}
      )
    })

    it('should rename a key if provided a RENAME response', () => {
      assert.deepEqual(
        updateAt(['name'],ops.renameTo('firstName'))(example),
        {firstName:'Ben',age:29,favourite:{color:'blue'}}
      )
    })

    it('should not create a key if renaming a non-existing key', () => {
      assert.deepEqual(
        updateAt(['cake'],ops.renameTo('pudding'))(example),
        example
      )
    })

    it('should create objects as necessary when the path does not exist', () => {
      assert.deepEqual(
        updateAt(['favourite','whisky','region'], 'campbelltown')(example),
        {name:'Ben',age:29,favourite:{color:'blue',whisky:{region:'campbelltown'}}}
      )
    })

    it('should allow a single string as a first argument', () => {
      assert.deepEqual(
        updateAt('key',5)({a:0}),
        {key:5,a:0}
      )
    })

    it('should update an array index if provided a numeric key', () => {
      const source = {a:1,b:[0,1,2]}
      assert.deepEqual(
        updateAt(['b',1], (x) => x+5)(source),
        {a:1,b:[0,6,2]}
      )
    })

    it('should explode if attempting to update a non-numeric key in an array', () => {
      assert.throws(() => {
        const source = {a:1,b:[0,1,2]}
        updateAt(['b','nope'], (x) => x+5)(source)
      })
    })

    it('should explode if attempting to rename an array key', () => {
      assert.throws(() => {
        const source = {a:1,b:[0,1,2]}
        updateAt(['b',1], ops.renameTo('boom'))(source)
      })
    })

    it('should successfully delete at an array index', () => {

    })

});

describe('updates', () => {
  it('should compose all functions provided, in given order', () => {
    const update1 = (x) => x+1
    const update2 = (x) => x*2
    const update3 = (x) => x+5
    assert.equal(updates([update1,update2,update3])(1), 9)
  })

  it('should treat an object as a flat key->updateAt map', () => {
    const source = {
      age: 10,
      name: 'ben',
      replacedObject: {
        not_here_anymore: true
      }
    }
    const transform = updates({
      name: (x) => x.toUpperCase(),
      age: 20,
      replacedObject:{
        value: 10
      }
    })
    assert.deepEqual(transform(source),{
      name: 'BEN',
      age: 20,
      replacedObject:{
        value: 10
      }
    })
  })

  it('should explode if provided a non-function argument as an update', () => {
    assert.throws(() => {
      updates(['hi'])(1)
    })
  })

})

describe('updateDeep', () => {
  it('should apply updates as supplied by pattern', () => {
    const example = {
      name: 'Ben',
      age: 29,
      favourite:{
        color: 'blue',
        pet:{
          kind: 'dog',
          name: 'spot'
        }
      }
    }

    assert.deepEqual(
      updateDeep({
        age: (age) => age+1,
        favourite: updateAt(['pet','name'],'charlie')
      })(example),
      {
        name:'Ben',
        age: 30,
        favourite:{
          color: 'blue',
          pet:{
            kind:'dog',
            name:'charlie'
          }
        }
      }
    )

  })
  it('should allow null as a value', () => {
    const example = {
      name: 'Ben',
      age: 10
    }

    assert.deepEqual(
      updateDeep({
        name: null,
      })(example),
      {
        name:null,
        age: 10
      }
    )

  })
})

describe('makePath', () => {
  it('should turn a dot-delimited string into an array', () => {
    assert.deepEqual(makePath('a.b.c'),['a','b','c'])
  })
  it('should turn numeric components into numbers', () => {
    assert.deepStrictEqual(makePath('a.0.x'), ['a',0,'x'])
  })
})

describe('mapObj', () => {
  it('should produce an updater for each value/key pair in passed object', () => {

    const example = {
      name: 'Ben',
      age: 10,
      notHereAnymore: 'value',
      ignored: 'some value'
    }

    assert.deepEqual(
      mapObj((value,key) => {
        switch (key){
          case 'name': return 'BEN';
          case 'age': return 30;
          case 'notHereAnymore': return ops.delete;
          default: 
            return value
        }
      })(example),
      {
        name: 'BEN',
        age: 30,
        ignored: 'some value'
      }
    )

  })

})
