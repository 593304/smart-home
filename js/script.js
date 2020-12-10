let smartHome = {};

const DOMOTICZ_URL = 'http://192.168.1.67:8080/';
const LIST_ROOMS_URI = 'json.htm?type=plans&order=name&used=true';
const LIST_DEVICES_BY_ROOMS_URI = 'json.htm?type=command&param=getplandevices&idx={idx}';
const DEVICE_STATE_URI = 'json.htm?type=devices&rid={idx}';
const TOGGLE_URI = 'json.htm?type=command&param=switchlight&idx={idx}&switchcmd=Toggle';
const BRIGHTNESS_URI = 'json.htm?type=command&param=switchlight&idx={idx}&switchcmd=Set%20Level&level={level}';
const COLOR_TEMP_URI = 'json.htm?type=command&param=setkelvinlevel&idx={idx}&kelvin={color}';

smartHome.domoticz = (() => {
    let devicesByRooms = {};

    let init = () => {
        $.get(`${DOMOTICZ_URL}${LIST_ROOMS_URI}`)
            .done(function(roomResponse) {
                console.info('Rooms', roomResponse);
                roomResponse.result.forEach(room => {
                    $.get(`${DOMOTICZ_URL}${LIST_DEVICES_BY_ROOMS_URI.replace('{idx}', room.idx)}`)
                        .done(function(deviceResponse) {
                            console.info('Devices', deviceResponse);
                            deviceResponse.result.forEach(device => {
                                $.get(`${DOMOTICZ_URL}${DEVICE_STATE_URI.replace('{idx}', device.devidx)}`)
                                    .done(function(deviceStatus) {
                                        console.info('Device status', deviceStatus);
                                        if(!devicesByRooms[room.Name])
                                            devicesByRooms[room.Name] = [];
                                        devicesByRooms[room.Name].push(deviceStatus);
                                    })
                                    .fail(function(err) { console.error('Cannot retrieve device status from Domoticz', err); });
                            });
                        })
                        .fail(function(err) { console.error('Cannot retrieve devices by room from Domoticz', err); });
                });
            })
            .fail(function(err) { console.error('Cannot retrieve rooms from Domoticz', err); });
    }

    return {
        init: init,
        devicesByRooms: devicesByRooms
    }
})();

let initSwitchStates = () => {
    $('.controls').each(function() {
        let idx = $(this).attr('idx');
        let element = this;
        $.get(`${DOMOTICZ_URL}${DEVICE_STATE_URI.replace('{idx}', idx)}`)
            .done(function(resp) {
                console.log(resp);
                let status = resp.result[0].Status.toLowerCase();
                $(element).find('.switch-power').prop('checked', status === 'on');

                if(resp.result[0].Level) {
                    let level = resp.result[0].Level;
                    let levelMax = resp.result[0].MaxDimLevel;
                    $(element).find('.slider-brightness').attr('value', level);
                    $(element).find('.slider-brightness').attr('max', levelMax);
                }

                if(resp.result[0].Color) {
                    let color = JSON.parse(resp.result[0].Color);
                    let colorTempPercent = 0;
                    if((color.cw > 0 && color.cw+1 >= color.ww) || color.ww === 0)
                        colorTempPercent = color.cw / (color.cw + color.ww);
                    else
                        colorTempPercent = color.ww / (color.cw + color.ww);
                    if(colorTempPercent < 0.5 && color.cw+1 >= color.ww)
                        colorTempPercent = 0;
                    else if(color.cw+1 >= color.ww)
                        colorTempPercent -= 0.5;
                    let colorTemp = colorTempPercent*100;
                    $(element).find('.slider-color').attr('value', colorTemp);
                }
            })
            .fail(function(err) { console.error(err); });
    });
}

let toggle = (idx) => {
    $.get(`${DOMOTICZ_URL}${TOGGLE_URI.replace('{idx}', idx)}`)
        .done(console.log)
        .fail(console.error);
}

let brightness = (idx) => {
    let value = $(event.target || event.srcElement).val();
    let pId = $(event.target || event.srcElement).attr('id').replace('--b', '--p');
    $.get(`${DOMOTICZ_URL}${BRIGHTNESS_URI.replace('{idx}', idx).replace('{level}', value)}`)
        .done(function(resp) {
            console.log(resp);
            $('#' + pId).prop('checked', value > 0);
        })
        .fail(console.error);
}

let color = (idx) => {
    let value = $(event.target || event.srcElement).val();
    let pId = $(event.target || event.srcElement).attr('id').replace('--c', '--p');
    $.get(`${DOMOTICZ_URL}${COLOR_TEMP_URI.replace('{idx}', idx).replace('{color}', value)}`)
        .done(function(resp) {
            console.log(resp);
            console.log(pId);
            console.log($('#' + pId));
            $('#' + pId).prop('checked', true);
        })
        .fail(console.error);
}

$(() => {
    initSwitchStates();
});