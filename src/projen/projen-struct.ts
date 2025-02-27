import { dirname, join, posix } from 'path';
import { Property, TypeKind } from '@jsii/spec';
import { Component, typescript } from 'projen';
import { TypeScriptInterfaceFile } from './ts-interface';
import { Struct, HasProperties, IStructBuilder } from '../builder';

export interface ProjenStructOptions {
  /**
   * The name of the new struct
   */
  readonly name: string;
  /**
   * Doc string for the struct
   * @default - struct name
   */
  readonly description?: string;
  /**
   * The fqn of the struct
   *
   * Used to auto-add imports.
   * All referenced types are loaded based on the fqn hierarchy.
   *
   * See `importLocations` for customization options.
   *
   * @default `${project.name}.${options.name}`
   */
  readonly fqn?: string;
  /**
   * Output file path
   * @default - inside `srcdir` or `outdir` with the fqn turned into a path
   */
  readonly filePath?: string;
  /**
   * The module locations assemblies should be imported from
   *
   * All types are imported from the top-level of the module.
   * This map can be used to overwrite the default import locations.
   *
   * For local imports, the import traverse up a number of levels equivalent to the number of fqn parts of the rendered type.
   * E.g. if the the rendered type is `pkg.interface`, it is assumed to be at the top-level and imports from the same assembly would be from `./`.
   * If the rendered type is `pkg.nested.sub.interface` a local import will be from `../../`.
   *
   * @default - uses the assembly name for external packages
   * local imports traverse up a number of levels equivalent to the number of fqn parts
   */
  importLocations?: Record<string, string>;
}

/**
 * A component generating a jsii-compatible struct
 */
export class ProjenStruct
  extends Component
  implements IStructBuilder, HasProperties
{
  private builder: Struct;

  public constructor(
    private tsProject: typescript.TypeScriptProject,
    private options: ProjenStructOptions
  ) {
    super(tsProject);

    const fqn = options.fqn ?? `${tsProject.name}.${options.name}`;
    this.builder = Struct.fromSpec({
      kind: TypeKind.Interface,
      assembly: fqn.split('.').at(0) ?? tsProject.name,
      fqn,
      name: options.name,
      docs: {
        summary: options.description ?? options.name,
      },
    });
  }

  preSynthesize(): void {
    const baseDir = this.tsProject.srcdir ?? this.tsProject.outdir;
    const outputFile =
      this.options.filePath ?? join(baseDir, fqnToPath(this.builder.spec.fqn));
    new TypeScriptInterfaceFile(this.tsProject, outputFile, this.builder.spec, {
      importLocations: {
        [this.builder.spec.assembly]: relativeImport(outputFile, baseDir),
        ...this.options.importLocations,
      },
    });
  }

  only(...keep: string[]): IStructBuilder {
    this.builder.only(...keep);
    return this;
  }
  omit(...remove: string[]): IStructBuilder {
    this.builder.omit(...remove);
    return this;
  }
  add(...props: Property[]): IStructBuilder {
    this.builder.add(...props);
    return this;
  }
  update(name: string, update: Partial<Property>): IStructBuilder {
    this.builder.update(name, update);
    return this;
  }
  mixin(...sources: HasProperties[]): IStructBuilder {
    this.builder.mixin(...sources);
    return this;
  }
  public get properties(): Property[] {
    return this.builder.properties;
  }
}

function relativeImport(from: string, target: string): string {
  const diff = posix.relative(dirname(from), target);
  if (!diff) {
    return '.' + posix.sep;
  }
  return diff + posix.sep;
}

function fqnToPath(fqn: string): string {
  return join(...fqn.split('.').slice(1)) + '.ts';
}
