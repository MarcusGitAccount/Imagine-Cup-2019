# Upper

Developing Upper as an entry application for Imagine Cup 2019. Upper is meant to be a tool that will aid educators in teaching children with autism.

Upper is a tool meant to tackle the issues faced by teachers working with children with autism and other related disorders. 

Our project helps educators understand their pupils with special needs by giving them a web app tool to analyse children’s emotion and feedback to different questions during the class.

# Description

In the web application interface the teacher can log in to create and start a session to run during
the class. For each session the teacher can select which child’s data to monitor. In the same
page the teacher can create new questions or select existing ones to be asked during the
session after it is started(the questions are used as a mean of measuring the child’s progress
from class to class and his/her performance).

After starting the session the child’s heart rate data will be displayed on the top of the page. The
teacher now has the possibility to add notes to the session and to ask the selected questions by
using the user interface(marking the question asked in the application should coincide with
actually asking the question in real life).

Prior to actually creating the session and even entering the web application, a fitness band is
given to each kid in the class to measure their heart rate and a webcam is installed in front of
the class to gather video streaming data for the emotions detection. All the devices are
connected to an endpoint which consists of a Raspberry Pi 3. There is only one endpoint per
class which sends the session data to the cloud to be processed. It can also receive three
different additional commands that are sent to specific devices, one to ping the each child’s
device to check whether it is connected to the endpoint and ready and the other two are used to
start or stop the devices from sending data to the endpoint(the equivalent of starting and
stopping the session). For the ease of demonstrating the project we suppose each session(i.e.
class) consists of only one child and every child already has a device known and that will be
used(i.e. we already know the device prior to starting the session).

After the class has finished and all the questions from the lesson were asked the teacher can
stop the session. By doing this, the application will open a result page where all the information
from the prior session will be displayed.

For each question asked during the session, the teacher will be able see the average heart rate
and average emotion displayed by the child after the question was asked for a period of time(30
seconds). This is supposed to work the same way a lie detector works. A very high or low heart
rate coupled with fear or sadness might show that the child was either too nervous to answer or
didn’t have the knowledge at that moment. Drawing conclusions from this kind of the data can
give the teacher a somewhat of an idea on what the child has to improve on and what topics
he/she might have to invest time with the child on one on one private sessions.

Using this form of data analysis can actually replace the feedback the children with autism are
unfortunately not able to deliver. It might not be as good as a children saying what he/she does
not understand, but it is consistent and really helpful on the long run(teachers might come back
to a given session to reanalyze it and to better understand it and that is something you cannot
get just from feedback received from the children).

Furthermore, by clicking the compare button that exists for each question, the teacher will be
able to see how the child has been progressing by seeing biometric data for the same question
but from previous sessions. This way the educator can deduce whether the teaching methods
are effective in the long term and if the child has improved since the last class where a given
question was asked

# Application flow

![Application flow](https://github.com/MarcusGitAccount/Imagine-Cup-2019/blob/master/app_flow.PNG)


# Azure features used

Our project makes use of Azure features wherever it is possible and uses them to their full
potential. Below there is a list of the Azure resources that we used:

1. IOT Hub
We are using the IOT Hub resource to connect the devices to the cloud, control them
and receive telemetry data. Each unique endpoint is registered to the cloud(in our case
the endpoint is represented by a Raspberry Pi 3) as a unique device

2. Stream Analytics Job
This resource is the bread and butter of our cloud side part of the project because it
does the most of the heavy lifting and computing in the cloud allowing our embedded
and web applications to focus on more specific tasks.
We are using this resource to receive messages from the IOT Hub input. These
messages consist of pulse data from the children in the class and their computed
emotions. The stream is then processed and sent to the outputs: and event hub listener
and two tables in the database.

3. SQL Database
This resource is used to store data about users that access the application, class
students, session data(questions asked, notes etc), telemetry data(heart rate), emotions
detected during the session, session results. The database is also an output for the
stream analytics job.

4. Event Hub
This resource is used as a stream analytics job output too to receive processed
telemetry data(the processing consists of selecting valid data and averaging it every 5
seconds).

5. Virtual Machine
This one is used to host our web application. We chose this over the more specific Web
App resource because it suited our needs better and was also easier for us to configure
and get it going.

6. Emotions api
We are using the emotions api to detect the current emotion for the children evaluated
during the class session and send the data to the IOT Hub.
