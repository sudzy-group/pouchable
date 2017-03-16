# @Pouchable
PouchDB simplified by TypeScript Decorators (annotations)

[![npm version](https://badge.fury.io/js/pouchable.svg)](https://badge.fury.io/js/pouchable)
[![Build Status](https://travis-ci.org/sudzy-group/pouchable.svg?branch=master)](https://travis-ci.org/sudzy-group/pouchable)
[![Coverage Status](https://coveralls.io/repos/github/sudzy-group/pouchable/badge.svg)](https://coveralls.io/github/sudzy-group/pouchable)
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
        group: "default",
        name: "title",   
        mandatory: true,
        search_by: [ _.identity ] // need lodash
    })
    title: string;

    @EntityField({
        group: "info",
        name: "author"
    })
    author: string;

    @EntityField({
        group: "info",
        name: "content",
        validate: (v) => { return v.length < 140 } 
    })
    content: string;
}
```

Declare your collection:
```typescript
class Posts extends Collection<Post> {
    public getPrefix(): string {
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
# See it in action, our team example:
In this example, you will see a live, up-to-date code that is using pouchable and shows real usecases.
https://github.com/sudzy-group/com.sudzy.db

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

# Contributing to Pouchable
Contribution by pull requetsts is more than welcome, feel free to contact us team@sudzy.co
<pre>
npm install
npm test
</pre>

## Topics to enhance
* Change build to gulp
* A simple web-site that will gather community around us
* Schema documentation generation - see POC at https://goo.gl/xRVl7p
* Search keys with multiple properties
* Default value
* Error handling when partial update happens

