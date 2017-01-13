EzClient.web
====


```typescript
let playerId = "pjc0247";
let ez = EzClient.connect("ws://localhost:9916/", playerId, {});
```

```typescript
ez.onJoinPlayer = (packet: JoinPlayer) => {
    console.log("OnJoin : " + ez.players.length);
}
ez.onLeavePlayer = (packet: LeavePlayer) => {
    console.log("OnLeave : " + ez.players.length);
}
```

```typescript
ez.setWorldProperty({
  name : "rini"
});
```
