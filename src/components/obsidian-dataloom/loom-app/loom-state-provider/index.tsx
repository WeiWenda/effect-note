import React from 'react';

import { LoomState } from 'src/components/obsidian-dataloom/shared/loom-state/types/loom-state';
import LoomStateCommand from 'src/components/obsidian-dataloom/shared/loom-state/commands/loom-state-command';
import { useLogger } from 'src/components/obsidian-dataloom/shared/logger';
import { sortRows } from 'src/components/obsidian-dataloom/shared/loom-state/sort-rows';
import { useAppMount } from 'src/components/obsidian-dataloom/loom-app/app-mount-provider';

interface Props {
  initialState: LoomState;
  children: React.ReactNode;
  onSaveState: (
    appId: string,
    state: LoomState,
    shouldSaveFrontmatter: boolean
  ) => void;
}

const LoomStateContext = React.createContext<{
  searchText: string;
  isSearchBarVisible: boolean;
  resizingColumnId: string | null;
  loomState: LoomState;
  setLoomState: React.Dispatch<
    React.SetStateAction<{
      state: LoomState;
      shouldSaveToDisk: boolean;
      shouldSaveFrontmatter: boolean;
      time: number;
    }>
  >;
  toggleSearchBar: () => void;
  setResizingColumnId: React.Dispatch<React.SetStateAction<string | null>>;
  setSearchText: React.Dispatch<React.SetStateAction<string>>;
  doCommand: (command: LoomStateCommand) => void;
  onUndo: () => void;
  onRedo: () => void;
} | null>(null);

export const useLoomState = () => {
  const value = React.useContext(LoomStateContext);
  if (value === null) {
    throw new Error(
      'useLoomState() called without a <LoomStateProvider /> in the tree.'
    );
  }

  return value;
};

export default function LoomStateProvider({
  initialState,
  onSaveState,
  children,
}: Props) {
  const [loomState, setLoomState] = React.useState({
    state: initialState,
    shouldSaveToDisk: false,
    shouldSaveFrontmatter: true,
    time: Date.now(),
  });

  const [searchText, setSearchText] = React.useState('');
  const [isSearchBarVisible, setSearchBarVisible] = React.useState(false);
  const [resizingColumnId, setResizingColumnId] = React.useState<
    string | null
  >(null);

  const [history, setHistory] = React.useState<(LoomStateCommand | null)[]>([
    null,
  ]);
  const [position, setPosition] = React.useState(0);

  const logger = useLogger();
  const { reactAppId} = useAppMount();

  const [error, setError] = React.useState<unknown>(null);

  // React.useEffect(() => {
  //   const jsonSizeInBytes = new TextEncoder().encode(
  //     JSON.stringify(history)
  //   ).length;
  //   console.log(`Size of data: ${jsonSizeInBytes / 1024} kb`);
  //   console.log(`Size of data: ${jsonSizeInBytes / (1024 * 1024)} mb`);
  // }, [history]);

  // Whenever the table state is updated save it to disk
  const isMountedRef = React.useRef(false);
  React.useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      return;
    }

    const { shouldSaveToDisk, state, shouldSaveFrontmatter } = loomState;
    if (shouldSaveToDisk) {
      logger('LoomStateProvider saving state to disk!');
      onSaveState(reactAppId, state, shouldSaveFrontmatter);
    }
  }, [logger, reactAppId, loomState, onSaveState]);

  function handleToggleSearchBar() {
    setSearchBarVisible((prevState) => !prevState);
  }

  const undo = React.useCallback(() => {
    if (position > 0) {
      logger('handleUndoEvent');

      const currentPosition = position - 1;
      setPosition(currentPosition);

      const command = history[position];
      if (command !== null) {
        logger(command.constructor.name + '.undo');
        let newState = command.undo(loomState.state);
        if (command.shouldSortRows) {
          newState = sortRows(newState);
        }
        setLoomState({
          state: newState,
          shouldSaveToDisk: true,
          shouldSaveFrontmatter: command.shouldSaveFrontmatter,
          time: Date.now(),
        });
      }
    }
  }, [position, history, loomState, logger]);

  const redo = React.useCallback(() => {
    if (position < history.length - 1) {
      logger('handleRedoEvent');

      const currentPosition = position + 1;
      setPosition(currentPosition);

      const command = history[currentPosition];
      if (command !== null) {
        logger(command.constructor.name + '.redo');
        let newState = command.redo(loomState.state);
        if (command.shouldSortRows) {
          newState = sortRows(newState);
        }
        setLoomState({
          state: newState,
          shouldSaveToDisk: true,
          shouldSaveFrontmatter: command.shouldSaveFrontmatter,
          time: Date.now(),
        });
      }
    }
  }, [position, history, loomState, logger]);

  const doCommand = React.useCallback(
    (command: LoomStateCommand) => {
      setHistory((prevState) => {
        // If the position is not at the end of the history, then we want to remove all the commands after the current position
        if (position < history.length - 1) {
          const newState = prevState.slice(0, position + 1);
          return [...newState, command];
        } else {
          return [...prevState, command];
        }
      });
      setPosition((prevState) => prevState + 1);

      // Execute command
      let newState = command.execute(loomState.state);
      if (command.shouldSortRows) {
        newState = sortRows(newState);
      }
      setLoomState({
        state: newState,
        shouldSaveToDisk: true,
        shouldSaveFrontmatter: command.shouldSaveFrontmatter,
        time: Date.now(),
      });
    },
    [position, history, loomState]
  );

  if (error) {
    throw error;
  }

  return (
    <LoomStateContext.Provider
      value={{
        loomState: loomState.state,
        setLoomState,
        doCommand,
        onRedo: redo,
        onUndo: undo,
        isSearchBarVisible,
        searchText,
        resizingColumnId,
        setResizingColumnId,
        toggleSearchBar: handleToggleSearchBar,
        setSearchText,
      }}
    >
      {children}
    </LoomStateContext.Provider>
  );
}
