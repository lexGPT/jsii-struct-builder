# jsii-struct-builder

Build jsii structs with ease.

Jsii doesn't support TypeScript [Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html) like `Partial` or `Omit`, making it difficult to re-use existing [struct interfaces](https://aws.github.io/jsii/specification/2-type-system/#structs).
With this package, you can work around that limitation and create brand new struct interfaces based on the jsii specification of any existing structs, their parents, and your custom specification.

From jsii's perspective, these structs are completely new types.
From a maintainer's perspective, they require the same minimal effort as utility types do.
Everybody wins!

## Usage

Install with:

```console
npm install --save-dev @mrgrain/jsii-struct-builder
```

### Create from an existing Struct

Use the jsii FQN to mix in an existing struct.
Use `omit` to remove any properties you are not interested in.

```ts
new ProjenStruct(project, { name: 'MyProjectOptions'})
  .mixin(Struct.fromFqn('projen.typescript.TypeScriptProjectOptions'))
  .omit('sampleCode', 'projenrcTs', 'projenrcTsOptions');
```

### Adding new Properties

New properties can be added with a `@jsii/spec` definition.
Complex types can be used and will be imported using their FQN.
Any existing properties of the same name will be replaced.

```ts
new ProjenStruct(project, { name: 'MyProjectOptions'})
  .mixin(Struct.fromFqn('projen.typescript.TypeScriptProjectOptions'))
  .add(
    {
      name: 'booleanSetting',
      type: { primitive: jsii.PrimitiveType.Boolean }
    },
    {
      name: 'complexSetting',
      type: { fqn: "my_project.SomeEnum" }
    }
  );
```

### Updating existing Properties

Existing properties can be updated.
The provided partial `@jsii/spec` definition will be deep merged with the existing spec.
Updates can be also be used to rename properties.

```ts
new ProjenStruct(project, { name: 'MyProjectOptions'})
  .mixin(Struct.fromFqn('projen.typescript.TypeScriptProjectOptions'))
  .update('typescriptVersion', { optional: false })
  .update('sampleCode', {
    docs: {
        summary: 'New summary',
        default: 'false',
      }
    }
  )
  .update('eslint', { name: 'linter' });
```

### Advanced usage

`Struct` and `ProjenStruct` both share the same interface.
This allows some advanced applications.

For example you can manipulate the source for re-use:

```ts
const base = Struct.fromFqn('projen.typescript.TypeScriptProjectOptions');
base.omit('sampleCode', 'projenrcTs', 'projenrcTsOptions');
```

Or you can mix on `ProjenStruct` with another:

```ts
const foo = new ProjenStruct(project, { name: 'Foo'})
const bar = new ProjenStruct(project, { name: 'Bar'})

bar.mixin(foo);
```

The default configuration makes assumptions about the new interface that are usually okay.
For more complex scenarios `fqn`, `filePath` and `importLocations` can be used to influence the rendered output.

```ts
new JsiiInterface(project, {
  name: 'MyProjectOptions',
  fqn: 'my_project.nested.location.MyProjectOptions',
  filePath: 'src/nested/my-project-options.ts',
  importLocations: {
    'my_project': '../enums'
  }
})
.add({
  name: 'complexSetting',
  type: { fqn: "my_project.SomeEnum" }
});
```
