import './App.css';
import {Provider, defaultTheme, Item, TagGroup, Cell, Column, Row, TableBody, TableHeader, TableView} from '@adobe/react-spectrum';
import Lighting from './Lighting';
import {useDocumentColorScheme} from './useDocumentColorScheme';
import {useState} from 'react'
import BodyContent from './BodyContent';
import {enableTableNestedRows} from '@react-stately/flags';
import ButtonExamples from './sections/ButtonExamples';
import CollectionExamples from './sections/CollectionExamples';
import DateTimeExamples from './sections/DateTimeExamples';
import FormExamples from './sections/FormExamples';
import NavigationExamples from './sections/NavigationExamples';
import OverlayExamples from './sections/OverlayExamples';
import ColorExamples from './sections/ColorExamples';
import StatusExamples from './sections/StatusExamples';
import ContentExamples from './sections/ContentExamples';
import PickerExamples from './sections/PickerExamples';
import DragAndDropExamples from './sections/DragAndDropExamples';
import {AutocompleteExample} from './AutocompleteExample';

let columns = [
  {name: 'Foo', key: 'foo'},
  {name: 'Bar', key: 'bar'},
  {name: 'Baz', key: 'baz'}
];

let nestedItems = [
  {foo: 'Lvl 1 Foo 1', bar: 'Lvl 1 Bar 1', baz: 'Lvl 1 Baz 1', childRows: [
    {foo: 'Lvl 2 Foo 1', bar: 'Lvl 2 Bar 1', baz: 'Lvl 2 Baz 1', childRows: [
      {foo: 'Lvl 3 Foo 1', bar: 'Lvl 3 Bar 1', baz: 'Lvl 3 Baz 1'}
    ]},
    {foo: 'Lvl 2 Foo 2', bar: 'Lvl 2 Bar 2', baz: 'Lvl 2 Baz 2'}
  ]}
];

function App() {
  let [isLightMode, setIsLightMode] = useState(true);
  useDocumentColorScheme(isLightMode);
  enableTableNestedRows();

  return (
    <Provider theme={defaultTheme}
              colorScheme={isLightMode ? "light" : "dark"}
              height="100%"
              UNSAFE_style={{minHeight: '100vh'}}>
      <div className="content-padding">
        <Lighting isLightMode={isLightMode} onModeChange={setIsLightMode} />
        <TagGroup aria-label="Static TagGroup items example">
          <Item>News</Item>
          <Item>Travel</Item>
          <Item>Gaming</Item>
          <Item>Shopping</Item>
        </TagGroup>
        <BodyContent />
        <TableView aria-label="example table with nested rows" UNSTABLE_allowsExpandableRows width={500} height={200} >
          <TableHeader columns={columns}>
            {column => <Column>{column.name}</Column>}
          </TableHeader>
          <TableBody items={nestedItems}>
            {(item: any) =>
              (<Row key={item.foo} UNSTABLE_childItems={item.childRows}>
                {(key) => {
                  return <Cell>{item[key]}</Cell>;
                }}
              </Row>)
            }
          </TableBody>
        </TableView>
        <AutocompleteExample />
        <ButtonExamples />
        <CollectionExamples />
        <ColorExamples />
        <DateTimeExamples />
        <FormExamples />
        <NavigationExamples />
        <OverlayExamples />
        <StatusExamples />
        <ContentExamples />
        <PickerExamples />
        <DragAndDropExamples />
      </div>
    </Provider>
  );
}

export default App;
