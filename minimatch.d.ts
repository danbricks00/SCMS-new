declare module 'minimatch' {
  interface MinimatchOptions {
    debug?: boolean;
    nobrace?: boolean;
    noglobstar?: boolean;
    dot?: boolean;
    noext?: boolean;
    nocase?: boolean;
    nonull?: boolean;
    matchBase?: boolean;
    nocomment?: boolean;
    escape?: boolean;
    noquantifiers?: boolean;
    pathname?: boolean;
    flipNegate?: boolean;
    partial?: boolean;
    globDebug?: boolean;
    maxLength?: number;
    [key: string]: any;
  }

  function minimatch(path: string, pattern: string, options?: MinimatchOptions): boolean;
  
  namespace minimatch {
    function match(list: string[], pattern: string, options?: MinimatchOptions): string[];
    function filter(pattern: string, options?: MinimatchOptions): (path: string) => boolean;
    function makeRe(pattern: string, options?: MinimatchOptions): RegExp;
    const Minimatch: MinimatchConstructor;
    
    interface MinimatchConstructor {
      new (pattern: string, options?: MinimatchOptions): Minimatch;
    }
    
    interface Minimatch {
      pattern: string;
      options: MinimatchOptions;
      match(path: string): boolean;
      matchOne(file: string[], pattern: string[]): boolean;
    }
  }
  
  export = minimatch;
}