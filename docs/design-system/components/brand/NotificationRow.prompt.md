A captured-notification entry — serif title, supporting text, relative time, optional auto-reply pill.

```jsx
<Card variant="base" padding="none">
  <NotificationRow appName="WhatsApp" title="Mom" text="Call me when you're free 💚" time="3m ago" divider />
  <NotificationRow appName="Slack" title="#design" text="Ship it!" time="12m ago" autoReplied />
</Card>
```

Stack rows inside a `Card` with `divider` on all but the last. Set `showAvatar` for ungrouped feeds.
