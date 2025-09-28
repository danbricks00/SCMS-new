// Declare modules without specific type information
declare module 'app';
declare module 'assets';
declare module 'components';
declare module 'hooks';
declare module 'constants';
declare module 'scripts';
declare module 'src';

// Add more specific module declarations if needed
declare module '*.png' {
  const content: any;
  export default content;
}

declare module '*.jpg' {
  const content: any;
  export default content;
}

declare module '*.svg' {
  import React from 'react';
  const content: React.FC<React.SVGProps<SVGSVGElement>>;
  export default content;
}