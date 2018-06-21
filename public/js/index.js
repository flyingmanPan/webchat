const msg = document.getElementById('message');
var app = angular.module('webchat', []);
checkCookies();
var key=getCookie('key');
app.controller('myCtrl', function($scope) {
    $scope.data = []; //接收-消息队列
    $scope.name = '';
    $scope.content = '';
    $scope.personnum = 0;
    $scope.personlist = [];
    $scope.flag = false;
    const socket_url = 'http://localhost';
    var pl = angular.element(document.getElementById('person_list'));

    var socket = io(socket_url);
    socket.on('news', (data) => {
        if(data.name!=='系统消息')
        {
            var decrypted=CryptoJS.AES.decrypt(
                data.content,
                CryptoJS.enc.Utf8.parse(key),{
                    iv:CryptoJS.enc.Utf8.parse(key),
                    mode:CryptoJS.mode.CBC,
                    padding:CryptoJS.pad.Pkcs7
            });
            data.content = CryptoJS.enc.Utf8.stringify(decrypted);
        }
        ($scope.data).push(data);
        $scope.$apply();
        msg.scrollTop = msg.scrollHeight;
    });

    socket.on('history', (data) => {
        for(let x in data){
            var decrypted=CryptoJS.AES.decrypt(
                data[x].content,
                CryptoJS.enc.Utf8.parse(key),{
                iv:CryptoJS.enc.Utf8.parse(key),
                mode:CryptoJS.mode.CBC,
                padding:CryptoJS.pad.Pkcs7
            });
            data[x].content = CryptoJS.enc.Utf8.stringify(decrypted);
            ($scope.data).push(data[x]);
        }
        ($scope.data).push({content:'----------以上是历史消息-----------'});
        $scope.$apply();
        msg.scrollTop = msg.scrollHeight;
    });

    socket.on('updatePerson', (data) => {
        $scope.personlist = data;
        $scope.$apply();
    });

    $scope.sendMsg = (data = $scope.content)=>{
        var encrypted=CryptoJS.AES.encrypt(data,
            CryptoJS.enc.Utf8.parse(key),{
                iv:CryptoJS.enc.Utf8.parse(key),
            mode:CryptoJS.mode.CBC,
            padding:CryptoJS.pad.Pkcs7
        });
        encrypted=encrypted.toString();
        var date = new Date();
        if (!$scope.flag){
            $scope.flag = true;
            socket.emit('setUserName', $scope.name);
        }
        if ($scope.content!='')
            socket.emit('sendMsg', encrypted);
        $scope.content='';
    };

    $scope.enter = function(e){
        var keycode = window.event?e.keyCode:e.which;
        if(keycode==13){
            $scope.sendMsg();
        }
    };

    $scope.retract = function () {
        pl.removeClass('flipInX');
        pl.addClass('flipOutX');
    };

    $scope.spread = function () {
        pl.removeClass('flipOutX');
        pl.css({display:"block"});
        pl.addClass('flipInX');
    };
});
function getCookie(cname)
{
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i=0; i<ca.length; i++) 
    {
        var c = ca[i].trim();
        if (c.indexOf(name)==0)
        {
            return c.substring(name.length,c.length);
        }
    }
    return "";
}
function checkCookies()
{
    var key=getCookie('key');
    if(key==='')
    {
        key=prompt("Please enter your key:","");
        if (key!="" && key!=null)
        {
            setCookie("key",key,2);
        }
    }
}
function setCookie(cname,cvalue,exdays)
{
    var d = new Date();
    d.setTime(d.getTime()+(exdays*24*60*60*1000));
    var expires = "expires="+d.toGMTString();
    document.cookie = cname + "=" + cvalue + "; " + expires;
}