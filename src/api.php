<?php

require_once '../vendor/autoload.php';

use TencentCloud\Common\Credential;
use TencentCloud\Common\Profile\ClientProfile;
use TencentCloud\Common\Profile\HttpProfile;
use TencentCloud\Common\Exception\TencentCloudSDKException;
use TencentCloud\Ocr\V20181119\OcrClient;
use TencentCloud\Ocr\V20181119\Models\GeneralAccurateOCRRequest;
use TencentCloud\Ocr\V20181119\Models\GeneralHandwritingOCRRequest;

error_reporting(E_ALL ^ E_NOTICE ^ E_WARNING ^ E_DEPRECATED);

$dotenv = \Dotenv\Dotenv::createMutable(__DIR__);
$dotenv->load();
$id  = $_ENV['APP_ID'];
$sec = $_ENV['APP_SECRET'];
$s   = $_POST['source'];
$n   = $_POST['new'];
header("Content-Type: application/json; charset=UTF-8");
if (empty($s) || empty($n)) {
    echo '{}';
    exit;
}
$sData = explode(',', $s);
$nData = explode(',', $n);
try {


    $cred = new Credential($id, $sec);
    $httpProfile = new HttpProfile();
    $httpProfile->setEndpoint("ocr.tencentcloudapi.com");

    $clientProfile = new ClientProfile();
    $clientProfile->setHttpProfile($httpProfile);
    $client = new OcrClient($cred, "ap-beijing", $clientProfile);

    $req = new GeneralAccurateOCRRequest();
    // $req = new GeneralHandwritingOCRRequest();

    $params = array(
        "ImageBase64" => $sData[1],
        //手写体
        // "EnableWordPolygon "=> true,
        "EnableDetectSplit" => false,
        "IsWords" => true
    );
    $req->fromJsonString(json_encode($params));

    $resp = $client->GeneralAccurateOCR($req);
    // $resp = $client->GeneralHandwritingOCR($req);
    $data = [];

    $data['source'] = json_decode($resp->toJsonString(), true);

    $params = array(
        "ImageBase64" => $nData[1],
        "EnableDetectSplit" => false,
        "IsWords" => true
    );
    $req->fromJsonString(json_encode($params));

    // $resp = $client->GeneralHandwritingOCR($req);
    $resp = $client->GeneralAccurateOCR($req);
    $data['new'] = json_decode($resp->toJsonString(), true);

    $reg = ["\t", "\r", "\n", '\\', '/', '「', '」', '-', '=', '，', '。', '.', '；', ';', '、', '：', ':', '(', ')', '（', '）', '[', ']', '【', '】', '"', "'", '‘', '’', '“', '”', '>', '<', '》', '《', ' ', '_', '凵', '↵'];

    //原字符串处理
    $sourceData = [];
    foreach ($data['source']['TextDetections'] as $s1) {
        foreach ($s1['Words'] as $k => $w) {
            if (in_array($w['Character'], $reg)) {
                continue;
            }
            $tmp = [
                'word' => $w,
                'coord' => $s1['WordCoordPoint'][$k]
            ];
            $sourceData[] = $tmp;
        }
    }

    //新字符串处理
    $newData = [];
    foreach ($data['new']['TextDetections'] as $n1) {
        foreach ($n1['Words'] as $k => $w) {
            if (in_array($w['Character'], $reg)) {
                continue;
            }
            $tmp = [
                'word' => $w,
                'coord' => $n1['WordCoordPoint'][$k]
            ];
            $newData[] = $tmp;
        }
    }

    $a = array_reduce($sourceData, fn ($a, $b) => $a . $b['word']['Character'], '');
    $b = array_reduce($newData, fn ($a, $b) => $a . $b['word']['Character'], '');

    $res = http_curl_json('http://stamper.998990.xyz:8086', [
        'a' => $a,
        'b' => $b
    ], 'POST');
    $res_decode = json_decode($res, true);

    $polygons = [];
    $len = mb_strlen($res_decode['alignedSequences'][0]);


    $x = 0;
    $y = 0;
    $xDiff = [];
    $yDiff = [];
    for ($i = 0; $i < $len; $i++) {
        $tx = mb_substr($res_decode['alignedSequences'][0], $i, 1);
        $ty = mb_substr($res_decode['alignedSequences'][1], $i, 1);

        if ($tx === '⭐' && $ty === '⭐') {
            // $xDiff[] = [
            //     'color' => 'green',
            //     'coord' => $sourceData[$x]['coord']
            // ];
            // $yDiff[] = [
            //     'color' => 'green',
            //     'coord' => $newData[$y]['coord']
            // ];
            // $x++;
            // $y++;
            continue;
        } else if ($tx === '⭐' && $ty !== '⭐') {
            $yDiff[] = [
                'color' => 'green',
                'coord' => $newData[$y]['coord']
            ];
            $y++;
        } else if ($tx !== '⭐' && $ty === '⭐') {
            $xDiff[] = [
                'color' => 'green',
                'coord' => $sourceData[$x]['coord']
            ];
            $x++;
        } else {
            $x++;
            $y++;
        }
    }

    $r = time() . random_int(100000, 999999);
    if (str_contains($sData[0], 'jpeg')) {
        $sExt = 'jpeg';
    }
    if (str_contains($sData[0], 'png')) {
        $sExt = 'png';
    }
    $oldImg = 'img/' . $r . 'tmp-old.' . $sExt;
    $oldImgNew = 'img/' . $r . 'tmp-old-1.' . $sExt;

    if (str_contains($nData[0], 'jpeg')) {
        $nExt = 'jpeg';
    }
    if (str_contains($nData[0], 'png')) {
        $nExt = 'png';
    }
    $newImg = 'img/' . $r . 'tmp-new.'  . $nExt;
    $newImgNew = 'img/' . $r . 'tmp-new-1.' . $nExt;


    file_put_contents($oldImg, base64_decode($sData[1]));
    draw($oldImg, $xDiff, $oldImgNew);
    file_put_contents($newImg, base64_decode($nData[1]));
    draw($newImg, $yDiff, $newImgNew);

    echo json_encode([
        's' => './' . $oldImgNew . '?v=' . time() . random_int(0, 10000),
        'n' => './' . $newImgNew . '?v=' . time() . random_int(0, 10000),
    ]);

    // echo json_encode(['s'=>base64_encode(file_get_contents('tmp-old-1.png')), 'n'=>base64_encode(file_get_contents('tmp-new-1.png'))]);
} catch (TencentCloudSDKException $e) {
    echo $e;
}


function draw($imagePos, $data, $outputPos)
{
    $info = pathinfo($imagePos);
    $image = new \Imagick($imagePos);

    foreach ($data as $d) {
        $coord = array_map(fn ($n) => ['x' => $n['X'], 'y' => $n['Y']], $d['coord']['WordCoordinate']);
        $draw = new \ImagickDraw();
        $draw->setStrokeOpacity(1);
        $draw->setStrokeColor('red');
        $draw->setStrokeWidth(2);
        $draw->setFillColor('rgba(255,255,255,0)');
        $draw->polyline($coord);
        $image->drawImage($draw);
    }
    $image->setImageFormat('png');
    file_put_contents($outputPos, $image->getImageBlob());

    return true;
}

function http_curl_json($uri, $post_data = [],  $method = 'GET', $header = [])
{
    //初始化
    $ch      = curl_init();
    //   $reqdata = http_build_query($post_data);
    //   $length  = strlen($reqdata);
    $reqdata = json_encode($post_data);
    $length = strlen($reqdata);
    curl_setopt($ch, CURLOPT_HTTP_VERSION, CURL_HTTP_VERSION_1_1);
    //异步 1 非异步 0
    curl_setopt($ch, CURLOPT_TIMEOUT, 0);
    if (preg_match('/:(\d+)/', $uri, $port)) {
        $url = str_replace(':' . $port[1], '', $uri);
        $port = $port[1];
    } else {
        $url  = $uri;
        $port = 80;
    }
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_PORT, $port);
    curl_setopt($ch, CURLOPT_HEADER, 0);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    if (strtoupper($method) == 'POST') {
        curl_setopt($ch, CURLOPT_POST, 1);
        //   curl_setopt($ch, CURLOPT_POSTFIELDS, $reqdata);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $reqdata);
        array_push($header, 'Content-length: ' . $length);
    }
    //    curl_setopt($curl, CURLOPT_SSL_VERIFYHOST,0);
    //    curl_setopt($curl, CURLOPT_SSL_VERIFYHOST,0);
    $default_header = [
        // 'Content-Type: application/x-www-form-urlencoded;charset=utf-8',
        'Content-Type: application/json; charset=utf-8',
        //"Content-Length: {$length}",
        //'X-Requested-With: XMLHttpRequest',
        //'Accept: application/json, text/javascript, */*; q=0.01',
        //'Accept-Encoding: gzip, deflate',
        //'Accept-Language: en-US,en;q=0.9',
        //'Pragma: no-cache',
        'Cache-Control: no-cache',
        //                    'User-Agent: PostmanRuntime/7.15.0',
        'Accept: */*',
        //                    'accept-encoding: gzip,deflate',
    ];
    curl_setopt($ch, CURLOPT_HTTPHEADER, array_merge($default_header, $header));

    $data = curl_exec($ch);
    // $s = curl_getinfo($ch,CURLINFO_HEADER_OUT);
    if (false === $data) {
        $err = curl_error($ch);
    }
    curl_close($ch);

    return $data;
}
