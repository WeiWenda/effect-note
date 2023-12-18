import React from 'react';

import Tag from '../../../shared/tag';
import Wrap from '../../../shared/wrap';
import Input from '../../../shared/input';

import { Tag as TagType } from '../../../shared/loom-state/types/loom-state';
import Padding from '../../../shared/padding';

import './styles.css';

interface MenuHeaderProps {
  cellTags: TagType[];
  inputValue: string;
  onInputValueChange: (value: string) => void;
  onRemoveTag: (tagId: string) => void;
}

export default function MenuHeader({
  cellTags,
  inputValue,
  onInputValueChange,
  onRemoveTag,
}: MenuHeaderProps) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  function handleInputChange(value: string) {
    if (value.match(/^\s/)) return;
    //Trim white space when we're adding it
    onInputValueChange(value);
  }

  return (
    <div className='dataloom-tag-cell-edit__menu-header'>
      {cellTags.length > 0 && (
        <Padding px='md' pt='md' pb='sm'>
          <Wrap spacingX='sm'>
            {cellTags.map((tag) => (
              <Tag
                key={tag.id}
                id={tag.id}
                color={tag.color}
                content={tag.content}
                maxWidth='150px'
                showRemoveButton
                onRemoveClick={onRemoveTag}
              />
            ))}
          </Wrap>
        </Padding>
      )}
      <Input
        ref={inputRef}
        isTransparent
        focusOutline='none'
        placeholder='Search for a tag...'
        value={inputValue}
        onChange={handleInputChange}
      />
    </div>
  );
}
