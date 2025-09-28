declare module 'minimatch' {
  function minimatch(path: string, pattern: string, options?: any): boolean;
  namespace minimatch {
    function match(list: string[], pattern: string, options?: any): string[];
    function filter(pattern: string, options?: any): (path: string) => boolean;
    function makeRe(pattern: string, options?: any): RegExp;
  }
  export = minimatch;
}