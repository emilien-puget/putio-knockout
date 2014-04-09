<?php
$movie_name = $_GET['name'];
$language = $_GET['language'];
$moviehash = $_GET['moviehash'];
$token = $_GET['token'];
$moviesize = $_GET['moviesize'];

$request = xmlrpc_encode_request(
    "SearchSubtitles",
    array(
        $token,
        array(
            array('sublanguageid' => $language, 'moviehash' => $moviehash, 'moviebytesize' => $moviesize)
        )
    )
);
$context = stream_context_create(
    array(
        'http' => array(
            'method' => "POST",
            'header' => "Content-Type: text/xml",
            'content' => $request
        )
    )
);
$file = file_get_contents('http://api.opensubtitles.org/xml-rpc', false, $context);
$response = xmlrpc_decode($file);

foreach ($response['data'] as $data) {
    if ($data['MovieReleaseName'] != $movie_name) {
        continue;
    }

    die($data['ZipDownloadLink']);
}
if (isset($response['data'][0]['ZipDownloadLink'])) {
    die($response['data'][0]['ZipDownloadLink']);
}
die(false);