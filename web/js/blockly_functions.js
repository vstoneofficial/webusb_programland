var BLOCKAREA={
    workspace:{},
    defaultBlocks:null,
    startBlock:null,
    programFileName:'',
    childs:[],

    toolBoxs:{},

    selectedBlk:{},
    targettingBlk:null,

    TOOLBOX_BEGINNER:'toolboxBeginner',
    TOOLBOX_PRO:'toolboxPro',
    TOOLBOX_PLAYING:'toolboxPlaying',


    isInitialized:false,
    nowToolBoxID:null,
    code:""

};

var MenuText={
    BTN_NEW:"新規",
    BTN_SAVE:"保存",
    BTN_LOAD:"読み込み",
    BTN_UNDO:Blockly.Msg.UNDO,
    BTN_REDO:Blockly.Msg.REDO,
    BTN_SEQSTART:"実行",
    BTN_SEQSTOP:"停止",
    BTN_SIMSTART:"シミュレータを動かす",
    BTN_SIMSTOP:"シミュレータを止める",
};

BLOCKAREA.getDomText =function(filePath,callMethod)
{
    var xmlhttp = new XMLHttpRequest();

    xmlhttp.open("GET", filePath, true);
    xmlhttp.send(null);

    xmlhttp.onreadystatechange = function() {
        if(xmlhttp.readyState == 4 && xmlhttp.status == 200){
            var domText=xmlhttp.responseText;
            callMethod(domText);
        }
    }
}

BLOCKAREA.textToDom=function(domText){
    var dom;
    if(window.DOMParser) {
        var parser = new DOMParser();
        dom = parser.parseFromString(domText, "text/xml");

    }else if(window.ActiveXObject) {
        dom = new ActiveXObject("Microsoft.XMLDOM");
        dom = false;
        dom.loadXML(domText);
    }
    return dom;
}

BLOCKAREA.makeBlocklyInject_whenLoadXml=function(domText)
{
    var dom=BLOCKAREA.textToDom(domText);
    
    var tboxies_=dom.getElementsByTagName('toolboxes')[0];
    var tboxies=tboxies_.getElementsByTagName('toolbox');
    for(var i=0;i<tboxies.length;i++){
        var id = tboxies[i].getElementsByTagName('id')[0].textContent;
        BLOCKAREA.toolBoxs[id] = tboxies[i];
        //console.log(elem);
    }

    var options = { 
        toolbox : BLOCKAREA.toolBoxs[BLOCKAREA.TOOLBOX_BEGINNER],//toolbox, 

        horizontalLayout : true, 

//        readonly : true,
        css:true, 

        grid : {
            spacing : 20, 
            length : 21, 
            colour : '#ddd', 
            snap : true
        }, 
        zoom : {
            controls : true, 
            wheel : true, 
            startScale : 1.1, 
            maxScale : 3, 
            minScale : 0.5, 
            scaleSpeed : 1.1
        }
    };

    BLOCKAREA.workspace = Blockly.inject('blocklyDiv',options);
    BLOCKAREA.newProject();

    BLOCKAREA.workspace.addChangeListener(function(event){
        if(ROBOT.isPlaying()){
            if (    event.type == Blockly.Events.DELETE
                ||  event.type == Blockly.Events.CREATE
                ||  event.type == Blockly.Events.CHANGE) {
                ROBOT.stopWrite();
                ROBOT.stopPlay();
                alert("プログラムが変わったので中断します。");
            }
        }
    });
    BLOCKAREA.isInitialized=true;
}

BLOCKAREA.initWorld = function(){
    BLOCKAREA.getDomText('js/toolbox.xml',BLOCKAREA.makeBlocklyInject_whenLoadXml);
}


BLOCKAREA.download=function(savexml, filename) {

    var blob = new Blob([savexml], {type: "text/xml"}); // バイナリデータを作ります。

    if(window.navigator.msSaveBlob    ){
        var lower = filename.toLowerCase();
        var pattern =".xml";
        if(! ( (lower.lastIndexOf(pattern)+pattern.length===lower.length) && (pattern.length<=lower.length))){
            filename+=pattern;
        }
        window.navigator.msSaveBlob(blob,filename);
    }
    else{
        var a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.target = '_blank';
        a.download = filename;
        a.click();
    }
    BLOCKAREA.programFileName=filename;
}

BLOCKAREA.enableUndo=function(){
    if(BLOCKAREA.workspace.undoStack_.length!=0) return true;
    return false;
}
BLOCKAREA.enableRedo=function(){
    if(BLOCKAREA.workspace.redoStack_.length!=0) return true;
    return false;
}
BLOCKAREA.isDirty=function()
{
    if(BLOCKAREA.enableUndo() || BLOCKAREA.enableRedo()) return true;
    return false;
}
BLOCKAREA.clearUndoBuff=function()
{
    BLOCKAREA.workspace.undoStack_.length=0;
    BLOCKAREA.workspace.redoStack_.length=0;
    Blockly.Events.clearPendingUndo();
}

BLOCKAREA.saveProject =function()
{
    if(BLOCKAREA.isPlaying) return;

    if(BLOCKAREA.isiOS()){
        alert('この環境では対応していません。');
        return;
    }

    var xml = Blockly.Xml.workspaceToDom(BLOCKAREA.workspace);
    var xml_text = Blockly.Xml.domToText(xml);

    if(ROBOT.app_platrofm_mode==APP_PLATFORM.WINDOWS){
        //C#の関数の実行
        chrome.webview.hostObjects.class.saveFile(xml_text);
    }
    else if(ROBOT.app_platrofm_mode==APP_PLATFORM.IOS){
        //C#の関数の実行
        webkit.messageHandlers.saveFile.postMessage(xml_text);
    }
    else{
        user = window.prompt("保存するファイル名を入力してください", BLOCKAREA.programFileName);

        if(user==null || user.length==0) return;
        
        BLOCKAREA.download(xml_text, user);
    
    }
}

BLOCKAREA.isiOS=function(){
    //一旦iOSはファイル読み書きをさせない
    var ua = navigator.userAgent.toLowerCase();
    var ver = navigator.appVersion.toLowerCase();

    if ((ua.indexOf("iphone") != -1 || ua.indexOf("ipad") != -1) && ROBOT.app_platrofm_mode!=APP_PLATFORM.IOS) return true;
    return false;
}


BLOCKAREA.loadProject =function(){

    if(BLOCKAREA.isPlaying) return;

    var item = document.getElementById('file_api_input').files[0];
    var fr = new FileReader();

    fr.onload = function onFileLoad(e) {
        BLOCKAREA.workspace.clear();
        var xml = Blockly.Xml.textToDom(e.target.result );
        Blockly.Xml.domToWorkspace(xml, BLOCKAREA.workspace);
        BLOCKAREA.clearUndoBuff();
        
        //input type=file要素の初期化
		var area = document.getElementById('loadFile');
		var temp = area.innerHTML;
		area.innerHTML = temp        
    };
    BLOCKAREA.programFileName=item.name;
    fr.readAsText(item);

}

BLOCKAREA.undo=function() {
    if(BLOCKAREA.isPlaying) return;
    BLOCKAREA.workspace.undo(false);   
}

BLOCKAREA.redo=function() {
    if(BLOCKAREA.isPlaying) return;
    BLOCKAREA.workspace.undo(true);       
}

BLOCKAREA.resetDefaultProgram=function(){
    Blockly.Xml.domToWorkspace(BLOCKAREA.defaultBlocks,BLOCKAREA.workspace);
    BLOCKAREA.programFileName='';
    BLOCKAREA.clearUndoBuff();
}

BLOCKAREA.newProject=function() {


    if(BLOCKAREA.isPlaying) return;
    
    if(BLOCKAREA.isDirty()){
        var res = confirm("今作っているプログラムがきえます。\nよろしいですか?");
        if( res!=true ) return;
    }
    BLOCKAREA.workspace.clear();

    if(BLOCKAREA.defaultBlocks==null){
        BLOCKAREA.getDomText('js/defaultBlocks.xml',function(domText){
            var dom=BLOCKAREA.textToDom(domText);
            var a=dom.getElementsByTagName('defaultBlocks');
            BLOCKAREA.defaultBlocks = a[0];
            BLOCKAREA.resetDefaultProgram();
        });
    }
    else{
        BLOCKAREA.resetDefaultProgram();
    }

    if(ROBOT.app_platrofm_mode==APP_PLATFORM.WINDOWS) chrome.webview.hostObjects.class.newFile();
    else if(ROBOT.app_platrofm_mode==APP_PLATFORM.IOS) webkit.messageHandlers.newFile.postMessage("dammy");
    //Blockly.Xml.domToWorkspace(document.getElementById('defaultBlocks'),BLOCKAREA.workspace);
}
/*
function showCode() {
    // Generate JavaScript code and display it.
    Blockly.JavaScript.INFINITE_LOOP_TRAP = null;
    var code = Blockly.JavaScript.workspaceToCode(BLOCKAREA.workspace);
    alert(code);
}*/




BLOCKAREA.setAllBlocksEditableFlag=function(flag)
{
    var allBlocks = BLOCKAREA.workspace.getAllBlocks();
    for (var c = 0, d; d = allBlocks[c]; c++) {

        //console.table(d);
        if('setEditable' in d) d.setEditable(flag);
        if('setMovable' in d) d.setMovable(flag);
        if('setDeletable' in d){
            if('unDeletable' in d) d.setDeletable(false);
            else d.setDeletable(flag);
        } 
        d.unselect();
        //d.sqeStartInit();        
    }
    BLOCKAREA.seqpoint=0;
}

BLOCKAREA.setexecblockselect=function(pos){
    /*if(BLOCKAREA.seqpoint!=pos)*/{
        for(let b in BLOCKAREA.addressmap){
            if(BLOCKAREA.addressmap[b].topID<=pos && BLOCKAREA.addressmap[b].bottomID>=pos) BLOCKAREA.workspace.getBlockById(b).select();
            else if(BLOCKAREA.addressmap[b].topID<=BLOCKAREA.seqpoint && BLOCKAREA.addressmap[b].bottomID>=BLOCKAREA.seqpoint)  BLOCKAREA.workspace.getBlockById(b).unselect();
        }
        BLOCKAREA.seqpoint=pos;
    }
}

BLOCKAREA.changeToolBox=function(ID){
    var targetToolBoxID=ID;
    if(ID in BLOCKAREA.toolBoxs){
        if(BLOCKAREA.nowToolBoxID==ID) return;
    }
    else targetToolBoxID = BLOCKAREA.TOOLBOX_BEGINNER;

    BLOCKAREA.workspace.toolbox_.clearSelection();
    BLOCKAREA.workspace.updateToolbox(BLOCKAREA.toolBoxs[targetToolBoxID]);
    BLOCKAREA.nowToolBoxID=targetToolBoxID;
}



BLOCKAREA.clickLoadButton=function(){
    if(BLOCKAREA.isPlaying) return;

    if(BLOCKAREA.isiOS()){
        alert('この環境では対応していません。');
        return;
    }

    if(BLOCKAREA.isDirty()){
        var res = confirm("別のプログラムを読み込むと、今作っているプログラムがきえます。\nよろしいですか?");
        if( res!=true ) return;
    }

    if(ROBOT.app_platrofm_mode==APP_PLATFORM.WINDOWS){
        //C#の関数の実行
        chrome.webview.hostObjects.class.loadFile().then(xml=>{
            loadmethod(xml);

            //console.log(xml);
            /*
            if(xml && xml.length>0){
                BLOCKAREA.workspace.clear();
                Blockly.Xml.domToWorkspace(Blockly.Xml.textToDom(xml), BLOCKAREA.workspace);
                BLOCKAREA.clearUndoBuff();
                
                //input type=file要素の初期化
                var area = document.getElementById('loadFile');
                var temp = area.innerHTML;
                area.innerHTML = temp        
            }*/
        });

    }
    else if(ROBOT.app_platrofm_mode==APP_PLATFORM.IOS){
        //C#の関数の実行
        webkit.messageHandlers.loadFile.postMessage("dammy")/*.then(xml=>{
            loadmethod(xml);
            
            //console.log(xml);
            if(xml && xml.length>0){
                BLOCKAREA.workspace.clear();
                Blockly.Xml.domToWorkspace(Blockly.Xml.textToDom(xml), BLOCKAREA.workspace);
                BLOCKAREA.clearUndoBuff();
                
                //input type=file要素の初期化
                var area = document.getElementById('loadFile');
                var temp = area.innerHTML;
                area.innerHTML = temp        
            }
        });*/

    }

    else{
    
        document.getElementById('file_api_input').click();    
    
    }
}

BLOCKAREA.selectBlock=function(blk){
    
    this.targettingBlk=blk;
}


function loadmethod(xml){
    if(xml && xml.length>0){
        BLOCKAREA.workspace.clear();
        Blockly.Xml.domToWorkspace(Blockly.Xml.textToDom(xml), BLOCKAREA.workspace);
        BLOCKAREA.clearUndoBuff();
        
        //input type=file要素の初期化
        var area = document.getElementById('loadFile');
        var temp = area.innerHTML;
        area.innerHTML = temp        
    }

}

function loadxml(xml){
    if(BLOCKAREA.isDirty()){
        var res = confirm("別のプログラムを読み込むと、今作っているプログラムがきえます。\nよろしいですか?");
        if( res!=true ) return;
    }
    loadmethod(xml);

    /*if(xml && xml.length>0){
        BLOCKAREA.workspace.clear();
        Blockly.Xml.domToWorkspace(Blockly.Xml.textToDom(xml), BLOCKAREA.workspace);
        BLOCKAREA.clearUndoBuff();
        
        //input type=file要素の初期化
        var area = document.getElementById('loadFile');
        var temp = area.innerHTML;
        area.innerHTML = temp        
    }*/

    return "true";    
}




BLOCKAREA.makeCode = function(isplay)
{
    if(ROBOT.isPlaying()) return;

    ROBOT.startplay=isplay;
    
    BLOCKAREA.startBlock = null;
    var topBlocks = BLOCKAREA.workspace.getTopBlocks(!0);
    for (var c = 0, d; d = topBlocks[c]; c++) {

        if('type' in d && d.type=='start'){
            BLOCKAREA.startBlock = d;
            BLOCKAREA.selectBlock(BLOCKAREA.startBlock);
            break ;
        }
    }
    
    if(BLOCKAREA.startBlock==null){
            alert("スタートブロックがありません。");
    } else{
        BLOCKAREA.addressmap={};
        BLOCKAREA.makeinit();
        BLOCKAREA.make(BLOCKAREA.startBlock);
        BLOCKAREA.addEndCode();
        BLOCKAREA.makeinit();
        BLOCKAREA.make(BLOCKAREA.startBlock);
        BLOCKAREA.addEndCode();

        console.log(BLOCKAREA.code);

        ROBOT.writeSeq();
    }
    //最後に終了のコードを追加する(終了がつながっていないケースを考慮))
}

//BLOCKAREA.getEndCode = function(){return `${itohex(CODE_MAP.RC_MEMW_B)}${itohex(MEMMAP_TBL.MOT1_SPD)}0400000000${itohex(CODE_MAP.RC_STOP)}`;}
//BLOCKAREA.getEndCodeLength = function(){return 8};
BLOCKAREA.getEndCode = function(){return `${itohex(CODE_MAP.RC_STOP)}`;}
BLOCKAREA.getEndCodeLength = function(){return 1};

BLOCKAREA.addEndCode = function (){
    //endが無い場合に備えた終了コード
    if(BLOCKAREA.lastblock && BLOCKAREA.lastblock.type=='end') return;
    BLOCKAREA.code += BLOCKAREA.getEndCode();
    BLOCKAREA.address += BLOCKAREA.getEndCodeLength();

}

BLOCKAREA.makeinit = function (){
    BLOCKAREA.childs=[];
    BLOCKAREA.address=MEMMAP_TBL.MEMMAP_SIZE;
    BLOCKAREA.loopnest=0;
    BLOCKAREA.code="";
    BLOCKAREA.passedBlock=[];
    BLOCKAREA.lastblock=null;
}

//再帰的に全体の終了まで進む関数
BLOCKAREA.make = function(block){
    while(block){
        var childs=[];
        //ブロックごとのコードを生成。もし分岐があるならこの中でchildsに登録させる
        if(BLOCKAREA.passedBlock.indexOf(block)<0){
            childs = block.makecode();
            BLOCKAREA.passedBlock.push(block);
        }

        //もし分岐等子供ブロックが存在する場合、makecodeメソッド内であらかじめ登録しておき、再帰的に本メソッドを呼ぶ
        var loop=0;
        while(childs && childs.length>0){
            haschild=true;
            BLOCKAREA.make(childs.pop());
            block.makecode_bottom(loop++);
        }

        //次のブロックに進む
        var next = block.getNextBlock();

        /*if(next==null && block.type!='end'){
            next = block.getSurroundParent();
            if(next!=null && next.id==BLOCKAREA.startBlock.id) next=null;
        }*/
        BLOCKAREA.lastblock=block;
        block=next;

        //もしnextがnullなら過去の分岐に戻って続ける
       // if(block==null && BLOCKAREA.branch.length>0) block = BLOCKAREA.branch.pop();
    }

}

