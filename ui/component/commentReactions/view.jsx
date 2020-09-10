// @flow
import * as ICONS from 'constants/icons';
import React from 'react';
import Button from 'component/button';

type Props = {};

export default function CommentReactions(props: Props) {
  return (
    <>
      <Button title={__('Upvote')} icon={ICONS.UPVOTE} className="comment__action" />
      <Button title={__('Downvote')} icon={ICONS.DOWNVOTE} className="comment__action" />
    </>
  );
}
