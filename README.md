# fn-update	 
Functional updates for immutable objects

## Why?
Because `{...extending, stuff: 'can', be:{ really:{ tedious:{ especially:{ when: 'deeply nested'}}}}}`

`fn-update` is cool (useful?) because:
 - updates preserve identity, recursively - especially useful for libraries like `redux`
 - the interface is flexible - update functions are decoupled from the structure they are updating (i.e. you do not need to supply updates in the same nested structure as the object you are updating). This is especially useful for manipulating normalized json structures
 - all updates are curried functions... so you can pass them around, filter them, compose them, reuse them..
 - special treatment of `delete` and `rename` operations

## Idiomatic use cases

By far the most valuable use-case for fn-update is transforming data. 

For example:
 - transforming state in a Redux reducer
 - tweaking an API response in a promise chain
 - reusing or combining transformations 
 
```javascript
// some illustrative examples:

// 1. Transforming an api response with nested values
const toUpperCase = (value) => value.toUpperCase()
fetchJson('https://some-api.com/person.json')
    .then(updates({
      name: toUpperCase,
      address: updates({
        postCode: toUpperCase,
        country: 'GB',
        planet: ops.delete
      })
    }))



// 2. Updating redux state in a reducer:
// Instead of creating new objects every time, the updaters
// only modify what's necessary. This likely means fewer renders!
const reducer = (state,action) => ({

  'USER_LOADING' : (result) => updates({
    ready:false
  }),
  'USER_LOADED' : (result) => updates({
    ready: true,
    user: result
  }),
  'UPDATE_ADDRESS' : (result) => updates({
    updatesSinceLastSave: (c) => c+1,
    user: updates({
      address: result
    })
  })
  
})[action.type](action.payload)(state)
``` 

## Usage

```javascript
const {updateAt} = require('fn-update')

const person = {
  name:'Ben',
  preferences:{
    whisky:{
      region:'speyside'
    }
  }
}

// Basic usage: Update a deeply nested value
const shoutyBen = updateAt(['preferences','whisky','region'], v => v.toUpperCase())(person)

// Constant values are applied as if they were lifted
const ambivalentBen = updateAt(['preferences','whisky','region'], 'whatever')(person)

// Missing keys along a path are created when set
const alcoholicBen = updateAt(['preferences','brandy','region'],'yes')(person)

// Each value in the path is passed to the updater function:
const descriptiveBen = updateAt(
  ['preferences','whisky','region'],
  (region,whisky,preferences,rootObject) => {
    // We have access to each parent value as varargs
    return `${rootObject.name}'s preferential region is ${region}`
  }
)
```

```javascript
const {updateAt,updates} = require('fn-update')

// Multiple `updateAt` calls can be composed with `updates`
const oldAndBoringBen = updates([
  updateAt('age',92),
  updateAt(['preferences','food'],'rusks'),
  updateAt(['preferences','whisky','region'],'none')
])(person)
```

```javascript
const {updateAt,updates} = require('fn-update')

// `updates` can also take a pattern of updaters instead of a list
const oldAndBoringBen = updates({
  age: 92,
  preferences: updates({
    food: 'rusks',
    whisky: updateAt('region','none')
  })
})(person)
```


```javascript
// You can generate update functions any way you like.

// All the functions here do the same thing:

// This function:
updates( ['colour','orange juice','toothpaste'].map(
  pref => updateAt(['preferences',pref],'all')
))

// is equivalent to:
updateAt(['preferences'], updates({
  color: 'all',
  'orange juice': 'all',
  'toothpaste': 'all'
}))

// is equivalent to:
updates({
  preferences: updates({
    'color': 'all',
    'orange juice': 'all',
    'toothpaste': 'all'
  })
})

// is (almost) equivalent to:
// ( this one always creates a new `prefs` object, whereas the others won't if prefs isn't materially changed )
updateAt(['preferences'], (prefs) => ({
  ...prefs,
  'colour': 'all',
  'orange juice': 'all',
  'toothpaste': 'all'
}))

// is equivalent to:
updates([
  updateAt(['preferences','colour'], 'all'),
  updateAt(['preferences','orange juice'], 'all'),
  updateAt(['preferences','toothpaste'], 'all'),
  false && updateAt(['preferences'],'oh-no-we-gon-lose-everything!')
].filter(Boolean))


```

```javascript
// Keys can be renamed or deleted
const {updateAt,ops} = require('fn-update')

const namelessBen = updateAt(['name'], ops.delete)(person)

const americanBen = updateAt(['preferences','whisky'], ops.renameTo('whiskey'))(person)
```

```javascript
// Array values can be updated too:
const confusedSuperman = { aliases: ['Clark Kent','Kal something'] }
const superman = updateAt(['aliases',1],'Kal El')(confusedSuperman)

// and deleted
const clarkKent = updateAt(['aliases',1],ops.delete)(superman)

// although you could of course do the same thing with a filter...
const alsoClarkKent = updateAt(['aliases'],aliases => aliases.filter(x => x !== 'Kal El'))(superman)
```
