interface EzProperties {
    [key: string]: any;
}

class EzPlayer {
    public PlayerId: string;
    
    public Property: EzProperties;
    
    public constructor(init?: any) {
        (<any>Object).assign(this, init);
    }
}
class PacketBase {
    public PacketId: number;
    
    public constructor(init?: any) {
        (<any>Object).assign(this, init);
    }
}
class JoinPlayer extends PacketBase {
    public static readonly __type__ = "GSF.Ez.Packet.JoinPlayer, GSF.Ez.Packet"; 
    public __type = JoinPlayer.__type__;
    
    public Player: EzPlayer;
}
class LeavePlayer extends PacketBase {
    public static readonly __type__ = "GSF.Ez.Packet.LeavePlayer, GSF.Ez.Packet";
    public __type = LeavePlayer.__type__;
    
    public Player: EzPlayer;
}
class WorldInfo extends PacketBase {
    public static readonly __type__ = "GSF.Ez.Packet.WorldInfo, GSF.Ez.Packet";
    public __type = WorldInfo.__type__;
    
    public Player: EzPlayer;
    public OtherPlayers: Array<EzPlayer>;
    
    public Property: EzProperties;
}

class BroadcastPacket extends PacketBase {
    public static readonly __type__ = "GSF.Ez.Packet.BroadcastPacket, GSF.Ez.Packet";
    public __type = BroadcastPacket.__type__;
    
    public Sender: EzPlayer;
    
    public Type: Number;
    public Data: EzProperties;
}
class RequestBroadcastPacket extends PacketBase {
    public static readonly __type__ = "GSF.Ez.Packet.RequestBroadcastPacket, GSF.Ez.Packet";
    public __type = RequestBroadcastPacket.__type__;
    
    public Type: Number;
    public Data: EzProperties;
}

class ModifyPlayerProperty extends PacketBase {
    public static readonly __type__ = "GSF.Ez.Packet.ModifyPlayerProperty, GSF.Ez.Packet";
    public __type = ModifyPlayerProperty.__type__;
    
    public Player: EzPlayer;
    
    public Property: EzProperties;
}
class ModifyWorldProperty extends PacketBase {
    public static readonly __type__ = "GSF.Ez.Packet.ModifyWorldProperty, GSF.Ez.Packet";
    public __type = ModifyWorldProperty.__type__;
    
    public Property: EzProperties;
}

/* DELEGATES */
interface WorldInfoCallback { (packet: WorldInfo): void }
interface JoinPlayerCallback { (packet: JoinPlayer): void }
interface LeavePlayerCallback { (packet: LeavePlayer): void }
interface ModifyWorldPropertyCallback { (packet: ModifyWorldProperty): void }
interface ModifyPlayerPropertyCallback { (packet: ModifyPlayerProperty): void }

class EzClient {
    private host: string;
    private ws: WebSocket;
    
    public onWorldInfo: WorldInfoCallback;
    public onJoinPlayer: JoinPlayerCallback;
    public onLeavePlayer: LeavePlayerCallback;
    public onModifyWorldProperty: ModifyWorldPropertyCallback;
    public onModifyPlayerProperty: ModifyPlayerPropertyCallback;
    
    get isAlive(): boolean {
        return this.ws.readyState == WebSocket.OPEN;
    }
    
    public player: EzPlayer; 
    public players: Array<EzPlayer>;
    public worldProperty: EzProperties;
    public optionalWorldProperty: EzProperties;
    
    private nextPacketId: Number = 0; 
    
    static connect(
        host: string,
        playerId: string, property: EzProperties) : EzClient {
        
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
    } 
    
    start() {
        console.log("OpenWebSocket : " + this.host);
        this.ws = new WebSocket(this.host);
        
        this.ws.onopen = this.onOpen;
        this.ws.onclose = this.onClose;
        this.ws.onerror = this.onError;
        this.ws.onmessage = this.onMessage;
    }
    
    onOpen = () => {
        let p = new JoinPlayer({
            Player: this.player
        });
        this.send(p);
    }
    onClose = (e) => {
        console.log(e);
    }
    onError = (e) => {
        console.log(e);
    }
    onMessage = (e) => {
        console.log(e);
        
        var packet = JSON.parse(e.data);
        
        if (packet.__type == WorldInfo.__type__)
            this.processWorldInfo(packet as WorldInfo);
        else if (packet.__type == JoinPlayer.__type__)
            this.processJoinPlayer(packet as JoinPlayer);
        else if (packet.__type == LeavePlayer.__type__)
            this.processLeavePlayer(packet as LeavePlayer);
        else if (packet.__type == ModifyWorldProperty.__type__)
            this.processModifyWorldProperty(packet as ModifyWorldProperty);
        else if (packet.__type == ModifyPlayerProperty.__type__)
            this.processModifyPlayerProperty(packet as ModifyPlayerProperty);
    }
    
    processWorldInfo(packet: WorldInfo) {
        this.players = packet.OtherPlayers;
        this.players.push(this.player);
        this.player = packet.Player;
        this.worldProperty = packet.Property;
        
        if (this.onWorldInfo != null)
            this.onWorldInfo(packet);
    }
    processJoinPlayer(packet: JoinPlayer) {
        this.players.push(packet.Player);
        
        if (this.onJoinPlayer != null)
            this.onJoinPlayer(packet);
    }
    processLeavePlayer(packet: LeavePlayer) {
        this.players.splice(this.players.indexOf(packet.Player), 1);
        
        if (this.onLeavePlayer != null)
            this.onLeavePlayer(packet);
    }
    processModifyWorldProperty(packet: ModifyWorldProperty) {
        for (let key in packet.Property)
            this.worldProperty[key] = packet.Property[key];
        
        if (this.onModifyWorldProperty != null)
            this.onModifyWorldProperty(packet);
    }
    processModifyPlayerProperty(packet: ModifyPlayerProperty) {
        let player = this.players.filter(
            x => x.PlayerId == packet.Player.PlayerId)[0];
        
        for (let key in packet.Property)
            player.Property[key] = packet.Property[key];
            
        if (this.onModifyPlayerProperty != null)
            this.onModifyPlayerProperty(packet);
    }
    
    send(p: PacketBase) {
        let json = JSON.stringify(p);
        console.log(json);
        this.ws.send(json);
    }
    
    /* PUBLIC API */
    sendPacket(packetType: Number, data: EzProperties) {
        let p = new RequestBroadcastPacket({
           Type: packetType,
           Data: data 
        });
        this.send(p);
    }
    setWorldProperty(property: EzProperties) {
        let p = new ModifyWorldProperty({
            Property: property
        });
        this.send(p);   
    }
    setPlayerProperty(property: EzProperties) {
        let p = new ModifyPlayerProperty({
            Property: property
        });
        this.send(p);
    }
    
    disconnect() {
        this.ws.close();
    }
}
