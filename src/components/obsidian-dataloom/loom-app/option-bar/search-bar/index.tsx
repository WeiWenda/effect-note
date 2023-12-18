import Button from 'src/components/obsidian-dataloom/shared/button';
import Icon from 'src/components/obsidian-dataloom/shared/icon';
import Stack from 'src/components/obsidian-dataloom/shared/stack';
import Input from 'src/components/obsidian-dataloom/shared/input';

import { useLoomState } from 'src/components/obsidian-dataloom/loom-app/loom-state-provider';

export default function SearchBar() {
  const { searchText, setSearchText, isSearchBarVisible, toggleSearchBar } =
    useLoomState();

  return (
    <div className='dataloom-search-bar'>
      <Stack spacing='lg' isHorizontal>
        {isSearchBarVisible && (
          <Input
            placeholder='Type to search...'
            value={searchText}
            onChange={(value) => setSearchText(value)}
          />
        )}
        <Button
          icon={<Icon lucideId='Search' />}
          ariaLabel='Search'
          onClick={() => toggleSearchBar()}
        />
      </Stack>
    </div>
  );
}
