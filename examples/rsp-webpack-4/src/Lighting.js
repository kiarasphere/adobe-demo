import {Flex, Switch, Text} from '@adobe/react-spectrum';

function Lighting(props) {
  return (
    <Flex alignItems="center" justifyContent="space-between" marginBottom="size-300" width="100%">
      <Text>Theme</Text>
      <Switch isSelected={props.isLightMode} onChange={props.onModeChange}>
        Light mode
      </Switch>
    </Flex>
  );
}

export default Lighting;
