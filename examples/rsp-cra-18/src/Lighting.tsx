import {Flex, Switch, Text} from '@adobe/react-spectrum';

type LightingProps = {
  isLightMode: boolean;
  onModeChange: (isLightMode: boolean) => void;
};

function Lighting(props: LightingProps) {
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
