# @Pouchable
PouchDB simplified by TypeScript Decorators (annotations)

[![Build Status](https://travis-ci.org/sudzy-group/pouchable.svg?branch=master)](https://travis-ci.org/sudzy-group/pouchable)
[![Join the chat at https://gitter.im/pouchable](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/pouchable?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)


<pre>
npm install pouchdb pouchable --save
</pre>

Include the followings in your project
```typescript
import * as PouchDB from 'pouchdb';
import { Entity, EntityField, Collection } from 'pouchable'
```

Declare your Entity
```typescript
/**
 * Posts 
 */
class Post extends Entity {

    @EntityField({
        mandatory: true,
        group: "default",
        name: "title",
        search_by: [ _.identity ] // need lodash
    })
    title: string;

    @EntityField({
        mandatory: false,
        group: "info",
        name: "author"
    })
    author: string;

    @EntityField({
        mandatory: false,
        group: "info",
        name: "content"
    })
    content: string;
}
```

Declare your collection:
```typescript
class Posts extends Collection<Post> {
    public getName(): string {
        return "posts";
    }
}
```

Pouchable and PouchDB at your service:
```typescript
let db = new PouchDB("default");
let posts = new Posts(db, Post);

posts.insert({ title: "Pouchable is here!!!", author: "Joe"}).then((p) => {
   if (p.title != "Pouchable is here!!!") {
       throw new Error("not really hapenning...");
   }
   console.log(p.title);
}).catch(() => {});
```

# What API is available? 

```typescript
 posts.insert({ title: "Pouchable is here!!!", author: "Joe"}).then().catch(); 
 users.update(u, { street : "23 e 47th, New York, NY"} ).then().catch(); 
 users.get("_user_id").then().catch(); 
 users.remove(u);
 users.find("title", "search title", { startsWith : true });
```
# How Pouchable works under the hood?
![Image of Entity]
(https://raw.githubusercontent.com/sudzy-group/pouchable/master/resources/pouchable_entity.png)

# Contributing
Contribution is more than welcome! 
<pre>
npm install
npm test
</pre>
