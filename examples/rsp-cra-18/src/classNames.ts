import clsx from 'clsx';

export function classNames(
  cssModule: {[key: string]: string},
  ...values: Array<string | Record<string, boolean | undefined> | undefined>
): string {
  let classes: Array<string | Record<string, boolean | undefined> | undefined> = [];

  for (let value of values) {
    if (typeof value === 'object' && value) {
      let mapped: Record<string, boolean | undefined> = {};
      for (let key in value) {
        if (cssModule[key]) {
          mapped[cssModule[key]] = value[key];
        }
        mapped[key] = value[key];
      }
      classes.push(mapped);
    } else if (typeof value === 'string') {
      if (cssModule[value]) {
        classes.push(cssModule[value]);
      }
      classes.push(value);
    } else {
      classes.push(value);
    }
  }

  return clsx(...classes);
}
