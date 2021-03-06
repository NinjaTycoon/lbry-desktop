// @flow
import * as ICONS from 'constants/icons';
import * as RENDER_MODES from 'constants/file_render_modes';
import React, { useEffect, useState } from 'react';
import Button from 'component/button';
import classnames from 'classnames';
import LoadingScreen from 'component/common/loading-screen';
import FileRender from 'component/fileRender';
import UriIndicator from 'component/uriIndicator';
import usePersistedState from 'effects/use-persisted-state';
import { FILE_WRAPPER_CLASS } from 'page/file/view';
import Draggable from 'react-draggable';
import Tooltip from 'component/common/tooltip';
import { onFullscreenChange } from 'util/full-screen';
import { useIsMobile } from 'effects/use-screensize';
import debounce from 'util/debounce';

const DEBOUNCE_WINDOW_RESIZE_HANDLER_MS = 60;

type Props = {
  isFloating: boolean,
  fileInfo: FileListItem,
  uri: string,
  streamingUrl?: string,
  title: ?string,
  floatingPlayerEnabled: boolean,
  closeFloatingPlayer: () => void,
  renderMode: string,
};

export default function FileRenderFloating(props: Props) {
  const {
    fileInfo,
    uri,
    streamingUrl,
    title,
    isFloating,
    closeFloatingPlayer,
    floatingPlayerEnabled,
    renderMode,
  } = props;

  const isMobile = useIsMobile();
  const [fileViewerRect, setFileViewerRect] = useState();
  const [desktopPlayStartTime, setDesktopPlayStartTime] = useState();
  const [wasDragging, setWasDragging] = useState(false);
  const [position, setPosition] = usePersistedState('floating-file-viewer:position', {
    x: -25,
    y: window.innerHeight - 400,
  });
  const [relativePos, setRelativePos] = useState({ x: 0, y: 0 });

  const isPlayable = RENDER_MODES.FLOATING_MODES.includes(renderMode);
  const isReadyToPlay = isPlayable && (streamingUrl || (fileInfo && fileInfo.completed));
  const loadingMessage =
    fileInfo && fileInfo.blobs_completed >= 1 && (!fileInfo.download_path || !fileInfo.written_bytes)
      ? __("It looks like you deleted or moved this file. We're rebuilding it now. It will only take a few seconds.")
      : __('Loading');

  function getScreenWidth() {
    if (document && document.documentElement) {
      return document.documentElement.clientWidth;
    } else {
      return window.innerWidth;
    }
  }

  function getScreenHeight() {
    if (document && document.documentElement) {
      return document.documentElement.clientHeight;
    } else {
      return window.innerHeight;
    }
  }

  useEffect(() => {
    setRelativePos({
      x: position.x / getScreenWidth(),
      y: position.y / getScreenHeight(),
    });
  }, []);

  useEffect(() => {
    const handleMainWindowResize = debounce(e => {
      const GAP_PX = 10;
      const ESTIMATED_SCROLL_BAR_PX = 50;
      const FLOATING_PLAYER_CLASS = 'content__viewer--floating';
      const fpPlayerElem = document.querySelector(`.${FLOATING_PLAYER_CLASS}`);

      let newX = Math.round(relativePos.x * getScreenWidth());
      let newY = Math.round(relativePos.y * getScreenHeight());

      if (fpPlayerElem) {
        if (newX + fpPlayerElem.getBoundingClientRect().width > getScreenWidth() - ESTIMATED_SCROLL_BAR_PX) {
          newX = getScreenWidth() - fpPlayerElem.getBoundingClientRect().width - ESTIMATED_SCROLL_BAR_PX - GAP_PX;
        }
        if (newY + fpPlayerElem.getBoundingClientRect().height > getScreenHeight()) {
          newY = getScreenHeight() - fpPlayerElem.getBoundingClientRect().height - GAP_PX * 2;
        }
      }

      setPosition({ x: newX, y: newY });
    }, DEBOUNCE_WINDOW_RESIZE_HANDLER_MS);

    window.addEventListener('resize', handleMainWindowResize);
    return () => window.removeEventListener('resize', handleMainWindowResize);
  }, [relativePos]);

  useEffect(() => {
    function handleResize() {
      const element = document.querySelector(`.${FILE_WRAPPER_CLASS}`);
      if (!element) {
        return;
      }

      const rect = element.getBoundingClientRect();
      // $FlowFixMe
      setFileViewerRect(rect);
    }

    handleResize();
    window.addEventListener('resize', handleResize);
    onFullscreenChange(window, 'add', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      onFullscreenChange(window, 'remove', handleResize);
    };
  }, [setFileViewerRect, isFloating]);

  useEffect(() => {
    // @if TARGET='app'
    setDesktopPlayStartTime(Date.now());
    // @endif

    return () => {
      // @if TARGET='app'
      setDesktopPlayStartTime(undefined);
      // @endif
    };
  }, [uri]);

  if (!isPlayable || !uri || (isFloating && (isMobile || !floatingPlayerEnabled))) {
    return null;
  }

  function handleDragStart(e, ui) {
    // Not really necessary, but reset just in case 'handleStop' didn't fire.
    setWasDragging(false);
  }

  function handleDragMove(e, ui) {
    setWasDragging(true);
    const { x, y } = position;
    const newX = x + ui.deltaX;
    const newY = y + ui.deltaY;
    setPosition({
      x: newX,
      y: newY,
    });
  }

  function handleDragStop(e, ui) {
    if (wasDragging) {
      e.stopPropagation();
      setWasDragging(false);
      setRelativePos({
        x: position.x / getScreenWidth(),
        y: position.y / getScreenHeight(),
      });
    }
  }

  return (
    <Draggable
      onDrag={handleDragMove}
      onStart={handleDragStart}
      onStop={handleDragStop}
      defaultPosition={position}
      position={isFloating ? position : { x: 0, y: 0 }}
      bounds="parent"
      disabled={!isFloating}
      handle=".draggable"
      cancel=".button"
    >
      <div
        className={classnames('content__viewer', {
          'content__viewer--floating': isFloating,
          'content__viewer--inline': !isFloating,
        })}
        style={
          !isFloating && fileViewerRect
            ? { width: fileViewerRect.width, height: fileViewerRect.height, left: fileViewerRect.x }
            : {}
        }
      >
        <div
          className={classnames('content__wrapper', {
            'content__wrapper--floating': isFloating,
          })}
        >
          {isFloating && (
            <Tooltip label={__('Close')}>
              <Button
                onClick={closeFloatingPlayer}
                icon={ICONS.REMOVE}
                button="primary"
                className="content__floating-close"
              />
            </Tooltip>
          )}

          {isReadyToPlay ? (
            <FileRender
              className="draggable"
              uri={uri}
              // @if TARGET='app'
              desktopPlayStartTime={desktopPlayStartTime}
              // @endif
            />
          ) : (
            <LoadingScreen status={loadingMessage} />
          )}
          {isFloating && (
            <div className="draggable content__info">
              <div className="claim-preview__title" title={title || uri}>
                <Button label={title || uri} navigate={uri} button="link" className="content__floating-link" />
              </div>
              <UriIndicator link addTooltip={false} uri={uri} />
            </div>
          )}
        </div>
      </div>
    </Draggable>
  );
}
