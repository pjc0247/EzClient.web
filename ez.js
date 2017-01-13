var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var EzPlayer = (function () {
    function EzPlayer(init) {
        Object.assign(this, init);
    }
    return EzPlayer;
}());
var PacketBase = (function () {
    function PacketBase(init) {
        Object.assign(this, init);
    }
    return PacketBase;
}());
var JoinPlayer = (function (_super) {
    __extends(JoinPlayer, _super);
    function JoinPlayer() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.__type = JoinPlayer.__type__;
        return _this;
    }
    return JoinPlayer;
}(PacketBase));
JoinPlayer.__type__ = "GSF.Ez.Packet.JoinPlayer, GSF.Ez.Packet";
var LeavePlayer = (function (_super) {
    __extends(LeavePlayer, _super);
    function LeavePlayer() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.__type = LeavePlayer.__type__;
        return _this;
    }
    return LeavePlayer;
}(PacketBase));
LeavePlayer.__type__ = "GSF.Ez.Packet.LeavePlayer, GSF.Ez.Packet";
var WorldInfo = (function (_super) {
    __extends(WorldInfo, _super);
    function WorldInfo() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.__type = WorldInfo.__type__;
        return _this;
    }
    return WorldInfo;
}(PacketBase));
WorldInfo.__type__ = "GSF.Ez.Packet.WorldInfo, GSF.Ez.Packet";
var BroadcastPacket = (function (_super) {
    __extends(BroadcastPacket, _super);
    function BroadcastPacket() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.__type = BroadcastPacket.__type__;
        return _this;
    }
    return BroadcastPacket;
}(PacketBase));
BroadcastPacket.__type__ = "GSF.Ez.Packet.BroadcastPacket, GSF.Ez.Packet";
var RequestBroadcastPacket = (function (_super) {
    __extends(RequestBroadcastPacket, _super);
    function RequestBroadcastPacket() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.__type = RequestBroadcastPacket.__type__;
        return _this;
    }
    return RequestBroadcastPacket;
}(PacketBase));
RequestBroadcastPacket.__type__ = "GSF.Ez.Packet.RequestBroadcastPacket, GSF.Ez.Packet";
var ModifyPlayerProperty = (function (_super) {
    __extends(ModifyPlayerProperty, _super);
    function ModifyPlayerProperty() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.__type = ModifyPlayerProperty.__type__;
        return _this;
    }
    return ModifyPlayerProperty;
}(PacketBase));
ModifyPlayerProperty.__type__ = "GSF.Ez.Packet.ModifyPlayerProperty, GSF.Ez.Packet";
var ModifyWorldProperty = (function (_super) {
    __extends(ModifyWorldProperty, _super);
    function ModifyWorldProperty() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.__type = ModifyWorldProperty.__type__;
        return _this;
    }
    return ModifyWorldProperty;
}(PacketBase));
ModifyWorldProperty.__type__ = "GSF.Ez.Packet.ModifyWorldProperty, GSF.Ez.Packet";
var EzClient = (function () {
    function EzClient() {
        var _this = this;
        this.nextPacketId = 0;
        this.onOpen = function () {
            var p = new JoinPlayer({
                Player: _this.player
            });
            _this.send(p);
        };
        this.onClose = function (e) {
            console.log(e);
        };
        this.onError = function (e) {
            console.log(e);
        };
        this.onMessage = function (e) {
            console.log(e);
            var packet = JSON.parse(e.data);
            if (packet.__type == WorldInfo.__type__)
                _this.processWorldInfo(packet);
            else if (packet.__type == JoinPlayer.__type__)
                _this.processJoinPlayer(packet);
            else if (packet.__type == LeavePlayer.__type__)
                _this.processLeavePlayer(packet);
            else if (packet.__type == ModifyWorldProperty.__type__)
                _this.processModifyWorldProperty(packet);
            else if (packet.__type == ModifyPlayerProperty.__type__)
                _this.processModifyPlayerProperty(packet);
        };
    }
    Object.defineProperty(EzClient.prototype, "isAlive", {
        get: function () {
            return this.ws.readyState == WebSocket.OPEN;
        },
        enumerable: true,
        configurable: true
    });
    EzClient.connect = function (host, playerId, property) {
        var ez = new EzClient();
        if (host.substr(-1) != '/')
            host += '/';
        ez.host = host + "ez?version=1.0.0&userType=guest&userId=1";
        console.log("A");
        ez.player = new EzPlayer({
            PlayerId: playerId,
            Property: property
        });
        console.log(ez.player);
        ez.start();
        return ez;
    };
    EzClient.prototype.start = function () {
        console.log("OpenWebSocket : " + this.host);
        this.ws = new WebSocket(this.host);
        this.ws.onopen = this.onOpen;
        this.ws.onclose = this.onClose;
        this.ws.onerror = this.onError;
        this.ws.onmessage = this.onMessage;
    };
    EzClient.prototype.processWorldInfo = function (packet) {
        this.players = packet.OtherPlayers;
        this.players.push(this.player);
        this.player = packet.Player;
        this.worldProperty = packet.Property;
        if (this.onWorldInfo != null)
            this.onWorldInfo(packet);
    };
    EzClient.prototype.processJoinPlayer = function (packet) {
        this.players.push(packet.Player);
        if (this.onJoinPlayer != null)
            this.onJoinPlayer(packet);
    };
    EzClient.prototype.processLeavePlayer = function (packet) {
        this.players.splice(this.players.indexOf(packet.Player), 1);
        if (this.onLeavePlayer != null)
            this.onLeavePlayer(packet);
    };
    EzClient.prototype.processModifyWorldProperty = function (packet) {
        for (var key in packet.Property)
            this.worldProperty[key] = packet.Property[key];
        if (this.onModifyWorldProperty != null)
            this.onModifyWorldProperty(packet);
    };
    EzClient.prototype.processModifyPlayerProperty = function (packet) {
        var player = this.players.filter(function (x) { return x.PlayerId == packet.Player.PlayerId; })[0];
        for (var key in packet.Property)
            player.Property[key] = packet.Property[key];
        if (this.onModifyPlayerProperty != null)
            this.onModifyPlayerProperty(packet);
    };
    EzClient.prototype.send = function (p) {
        var json = JSON.stringify(p);
        console.log(json);
        this.ws.send(json);
    };
    /* PUBLIC API */
    EzClient.prototype.sendPacket = function (packetType, data) {
        var p = new RequestBroadcastPacket({
            Type: packetType,
            Data: data
        });
        this.send(p);
    };
    EzClient.prototype.setWorldProperty = function (property) {
        var p = new ModifyWorldProperty({
            Property: property
        });
        this.send(p);
    };
    EzClient.prototype.setPlayerProperty = function (property) {
        var p = new ModifyPlayerProperty({
            Property: property
        });
        this.send(p);
    };
    EzClient.prototype.disconnect = function () {
        this.ws.close();
    };
    return EzClient;
}());
var ez = EzClient.connect("ws://localhost:9916/", "asdf", {});
ez.onWorldInfo = function (packet) {
    console.log(packet);
    ez.setWorldProperty({ a: 1 });
};
ez.onJoinPlayer = function (packet) {
    console.log("OnJoin : " + ez.players.length);
};
ez.onLeavePlayer = function (packet) {
    console.log("OnLeave : " + ez.players.length);
};
