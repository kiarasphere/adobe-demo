import {addons, types} from 'storybook/manager-api';
import {IconButton} from 'storybook/internal/components';
import {MoonIcon, SunIcon} from '@storybook/icons';
import React, {useCallback, useEffect, useState} from 'react';

// Shares the query param namespace with the Provider switcher so the choice
// survives reloads and deep links, and is picked up by the story decorator.
const PARAM_KEY = 'providerSwitcher-colorScheme';

function DarkModeToggle({api}) {
  let param = api.getQueryParam(PARAM_KEY) || undefined;
  let [colorScheme, setColorScheme] = useState(param);
  let channel = addons.getChannel();
  let isDark = colorScheme === 'dark';

  let toggle = useCallback(() => {
    let next = isDark ? 'light' : 'dark';
    setColorScheme(next);
    channel.emit('provider/colorScheme', next);
    api.setQueryParams({[PARAM_KEY]: next});
  }, [isDark, channel, api]);

  // Re-emit the current choice whenever the preview is (re)mounted, e.g. when
  // switching stories, so the color scheme sticks.
  useEffect(() => {
    let reemit = () => {
      if (colorScheme) {
        channel.emit('provider/colorScheme', colorScheme);
      }
    };
    channel.on('rsp/ready-for-update', reemit);
    return () => {
      channel.removeListener('rsp/ready-for-update', reemit);
    };
  });

  return (
    <IconButton
      key="darkmode"
      active={isDark}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={toggle}>
      {isDark ? <SunIcon /> : <MoonIcon />}
    </IconButton>
  );
}

addons.register('DarkModeToggle', (api) => {
  addons.add('DarkModeToggle', {
    title: 'Dark mode',
    type: types.TOOL,
    match: ({viewMode}) => viewMode === 'story',
    render: () => <DarkModeToggle api={api} />
  });
});
