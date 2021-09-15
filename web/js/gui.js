FPS=10;

GUI={
    ruleMess:0,
    preTime:0,
    integral:0, //FPSに対する誤差の積分
    INTERVAL:1000/FPS,
    preSensor:{},
    snCol:{},
    changeReqField:false,
    changeReqRobot:false,
    isInitialized:false,
    initProcHandle:null,
    isPause:false
    
};

GUI.start=function() {

    BLOCKAREA.initWorld();
    //simInit();
    //getDomText("js/fields.xml");

    GUI.initProcHandle = setInterval(function() {
        if(BLOCKAREA.isInitialized){

            GUI.isInitialized=true;
            var dataObj=new Date();
            GUI.preTime=dataObj.getTime();
                        
            setInterval(GUI.update,GUI.INTERVAL);
            clearInterval(GUI.initProcHandle);
        }
    },100);

}

GUI.pushPlayButton = function(){

    if(ROBOT.isconnected()){
        if(ROBOT.isPlaying()) ROBOT.stopPlay();
        else BLOCKAREA.makeCode(true);
    }
    else alert("ロボットと通信していません。");
}

GUI.selectToolBox = function(type){
    if(!ROBOT.isPlaying()){
        BLOCKAREA.changeToolBox(type);
    }
}

GUI.preplayflag=false;


GUI.update=function() {

    var start_addr = MEMMAP_TBL.SENSOR1_VAL
    var elementid=["sensor1","sensor2","sensor3","sensor4"];

    for(var i=0;i<4;i++){
        var html = `センサ${i+1}:`;
        if(ROBOT.isconnected()) html += `${ROBOT.memmap[start_addr+i]}`;
        else html += "--";
        document.getElementById(elementid[i]).innerText = html;
    }
    document.getElementById('sensor_temp').innerText = ROBOT.isconnected()? `気温:${ROBOT.memmap[MEMMAP_TBL.TEMP]}℃` : `気温:--`;
    document.getElementById('sensor_hum').innerText = ROBOT.isconnected()? `湿度:${ROBOT.memmap[MEMMAP_TBL.HUM]}%` : `湿度:--`;

    //document.getElementById("connectButton").innerText = ROBOT.isconnected()? "切断" : "接続";
    document.getElementById("connectButton").className = ROBOT.isconnected()? "disconnectButton" : "myconnectButton";
    //未接続時、書き込み中は不可能。実行中は停止ボタンに切り替わる
    document.getElementById("playButton").disabled = ROBOT.isWriting || !ROBOT.isconnected();

    //未接続時、書き込み中、実行中は不可能
    document.getElementById("writeButton").disabled = ROBOT.isWriting || !ROBOT.isconnected() || ROBOT.isWriting || ROBOT.isPlaying();

    //書き込み中は不可能
    document.getElementById("connectButton").disabled = ROBOT.isWriting;

    document.getElementById("writeprogress").disabled = !ROBOT.isWriting;
    document.getElementById("writeprogress").value = ROBOT.writeprogress;
    

    //document.getElementById("playButton").disabled = document.getElementById("writeButton").disabled = !ROBOT.isconnected()

    var nowplayflag = ROBOT.isPlaying() || ROBOT.getIsWriting();
    if(nowplayflag!=GUI.preplayflag){
        BLOCKAREA.setAllBlocksEditableFlag(!nowplayflag);
        if(nowplayflag){
            BLOCKAREA.changeToolBox(BLOCKAREA.TOOLBOX_PLAYING);
            document.getElementById('playButton').className = 'stopButton';
        } else {
            let elements = document.getElementsByName('toolboxtype');
            
            for (let i = 0; i < elements.length; i++){
                if (elements.item(i).checked){
                    //checkValue = elements.item(i).value;
                    BLOCKAREA.changeToolBox(elements.item(i).value);
                    break;
                }
            }

            //BLOCKAREA.changeToolBox(BLOCKAREA.TOOLBOX_FULL);
            document.getElementById('playButton').className = 'playButton';
        }
    }
    GUI.preplayflag = nowplayflag;

    if(ROBOT.isPlaying()){
        BLOCKAREA.setexecblockselect(ROBOT.getseqpos());
    }

    if(ROBOT.iswritedcode==true){
        ROBOT.iswritedcode=false;
        if(ROBOT.startplay==true){
            alert("プログラムの書き込みが完了しました。実行開始します。");
            ROBOT.startPlay();
            ROBOT.startplay=false;
        }
        else alert("プログラムの書き込みが完了しました。");
    }

    ROBOT.updateMemmapHtml();
}
