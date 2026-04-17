import {Flex, Switch, Text} from '@adobe/react-spectrum';

type LightingProps = {
  selected: boolean;
  switch: (isSelected: boolean) => void;
};

function Lighting(props: LightingProps) {
  return (
    <Flex alignItems="center" justifyContent="space-between" marginBottom="size-300" width="100%">
      <Text>Theme</Text>
      <Switch isSelected={props.selected} onChange={props.switch}>
        Light mode
      </Switch>
    </Flex>
  );
}

export default Lighting;
