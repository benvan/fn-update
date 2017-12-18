# fn-update	 
Functional updates for immutable objects

## Why?
Because `{...extending, stuff: 'can', be:{ really:{ tedious:{ especially:{ when: 'deeply nested'}}}}}`

`fn-update` is cool (useful?) because:
 - updates preserve identity, recursively - especially useful for libraries like `redux`
 - the interface is flexible - update functions are decoupled from the structure they are updating (i.e. you do not need to supply updates in the same nested structure as the object you are updating). This is especially useful for manipulating normalized json structures
 - all updates are curried functions... so you can pass them around, filter them, compose them, reuse them..
 - special treatment of `delete` and `rename` operations

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
  updateAt('preferences','none')
])(person)
```

```javascript
// You can generate update functions any way you like.
// These functions all do the same thing:
updates( ['colour','orange juice','toothpaste'].map(
  pref => updateAt(['preferences',pref],'all')
))

updateAt(['preferences'], (prefs) => ({
  ...prefs,
  'colour': 'all',
  'orange juice': 'all',
  'toothpaste': 'all'
}))

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
