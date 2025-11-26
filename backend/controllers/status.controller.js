const response = require("../utils/responseHandler.utils")
const { uploadFileToCloudinary } = require("../config/cloudinaryConfig");
const Status = require("../models/Status.model");
const Message = require("../models/Message.model")


exports.createStatus = async(req,res) => {
    try {
        const { content, contentType} = req.body;
        const userId = req.user.userId;
        const file = req.file;

        let mediaUrl = null;
        let finalContentType = contentType || 'text'

        //handle file upload
        if(file) {
            const uploadFile = await uploadFileToCloudinary(file);

            if(!uploadFile?.secure_url) {
                return response(res,400,"Failed to upload media")
            };

            mediaUrl = uploadFile?.secure_url;

            if(file.mimetype.startsWith('image')) {
                finalContentType = "image"
            }else if(file.mimetype.startsWith('video')){
                finalContentType = "video"
            }else {
                return response(res,400,"Unported file type")
            }
        }else if(content?.trim()) {
            finalContentType = 'text';
        }else {
            return response(res,400,"Message ciontent is required")
        }

        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24)

        const status = new Status({
            user: userId,
            content: mediaUrl || content,
            contentType: finalContentType,
            expiresAt
        });

        await status.save();
        

        const populatedStatus = await Status.findById(status?._id)
        .populate("user", "username profilePicture")
        .populate("viewers", "username profilePicture")

        //Emitsocket event
        if(req.io && req.socketUserMap) {
            // Broadcast all connesting user except owner(creator)
            for(const [connectingUserId,socketId] of req.socketUserMap) {
                if(connectingUserId!== userId) {
                    req.io.to(socketId).emit("new_status",populatedStatus)
                }
            }
        }

        return response(res,201, "Status set successfully", populatedStatus);
    } catch (error) {
        console.error(error);
        return response(res,500, "Internal server error");
    }
}

exports.getStatus = async(req,res) => {
    try {
        const statuses = await Status.find({
            expiresAt: {$gt: new Date() },
        })
        .populate("user", "username profilePicture")
        .populate("viewers", "username profilePicture")
        .sort({createdAt: -1});

        return response(res,200, "Status retrieved successfully",statuses)
    } catch (error) {
        console.error(error);
        return response(res,500, "Internal server error");
    }
};


// exports.viewStatus = async (req,res) => {
//     const {statusId} = req.params;
//     const userId = req.user.userId;
//     try {
//         const status = await Status.findById(statusId);
//         if(!status) {
//             return response(res,404, 'status not found')
//         }
//         if(!status.viewers.includes(userId)) {
//             status.viewers.push(userId);
//             await status.save();


//             const updatedStatus = await Status.findById(statusId)
//                 .populate("user" , "username profilePicture")
//                 .populate("viewers", "username profilePicture");

//             //Emitsocket event
//             if(req.io && req.socketUserMap) {
                
//                 const statusOwnerSocketId = req.socketUserMap.get(status.user._id.toString())
//                 if(statusOwnerSocketId) {
//                     const viewData = {
//                         statusId,
//                         viewerId: userId,
//                         totalViewers: updatedStatus.viewers.length,
//                         viewers: updatedStatus.viewers
//                     }

//                     // req.io.to(statusOwnerSocketId).emit("status_viewed", viewData)
//                     req.io.to(statusOwnerSocketId).emit("status_viewed", statusId, updatedStatus.viewers);

//                 }
//             }
//         }else {
//             console.log("user already viewed the status")
//         }

//         return response(res,200 , 'status viewed succesfully')
//     } catch (error) {
//         return response(res, 500, 'Internal server error');
//     }
// }

// controllers/status.controller.js

// exports.viewStatus = async (req, res) => {
//   const { statusId } = req.params;
//   const userId = req.user.userId; // This is the ID of the person viewing

//   try {
//     const status = await Status.findById(statusId);
//     if (!status) {
//       return response(res, 404, 'status not found');
//     }

//     // --- FIX 1: Add a check to ensure the viewer is not the owner of the status ---
//     const isOwner = status.user.toString() === userId;

//     // Only add to viewers if they are not already in the list AND they are not the owner
//     if (!status.viewers.includes(userId) && !isOwner) {
//       status.viewers.push(userId);
//       await status.save();

//       const updatedStatus = await Status.findById(statusId)
//         .populate("user", "username profilePicture")
//         .populate("viewers", "username profilePicture");

//       // Emit socket event to the status owner
//       if (req.io && req.socketUserMap) {
//         const statusOwnerSocketId = req.socketUserMap.get(status.user._id.toString());
//         if (statusOwnerSocketId) {
//           const viewData = {
//             statusId,
//             viewerId: userId,
//             totalViewers: updatedStatus.viewers.length,
//             viewers: updatedStatus.viewers
//           };
//           req.io.to(statusOwnerSocketId).emit("status_viewed", viewData);
//         }
//       }
//     }

//     // --- FIX 2: Correct the typo from 'ResizeObserver' to 'res' ---
//     return response(res, 200, 'status viewed successfully');

//   } catch (error) {
//     console.error("Error viewing status:", error);
//     return response(res, 500, "Internal Server Error");
//   }
// };


// exports.viewStatus = async (req, res) => {
//   const { statusId } = req.params;
//   const userId = req.user.userId;

//   try {
//     const status = await Status.findById(statusId);
//     if (!status) {
//       return response(res, 404, 'status not found');
//     }

//     const isOwner = status.user.toString() === userId;

//     if (!status.viewers.includes(userId) && !isOwner) {
//       status.viewers.push(userId);
//       await status.save();

//       const updatedStatus = await Status.findById(statusId).populate(
//         'viewers',
//         'username profilePicture',
//       ); // Only need to re-populate viewers

//       if (req.io && req.socketUserMap) {
//         const statusOwnerSocketId = req.socketUserMap.get(
//           status.user.toString(),
//         );
//         if (statusOwnerSocketId) {
//           // --- FIX: Simplify the data sent over the socket ---
//           const viewData = {
//             statusId,
//             viewers: updatedStatus.viewers, // Just send the updated array
//           };
//           req.io.to(statusOwnerSocketId).emit('status_viewed', viewData);
//         }
//       }
//     }

//     return response(res, 200, 'status viewed successfully');
//   } catch (error) {
//     console.error('Error viewing status:', error);
//     return response(res, 500, 'Internal Server Error');
//   }
// };

// controllers/status.controller.js

// in controllers/status.controller.js

exports.viewStatus = async (req, res) => {
    console.log('--- THE VIEW STATUS CONTROLLER WAS HIT ---'); 
  const { statusId } = req.params;
  const viewerUserId = req.user.userId; // Renamed for clarity

  try {
    const status = await Status.findById(statusId);
    if (!status) {
      return response(res, 404, 'Status not found');
    }

    const isOwner = status.user.toString() === viewerUserId;

    // --- THE CRITICAL FIX ---
    // Correctly check if the viewer's ID is already in the array of ObjectIds.
    const hasViewed = status.viewers.some(viewerObjectId => viewerObjectId.toString() === viewerUserId);

    // Add logs to be 100% sure
    console.log(`--- STATUS VIEW DEBUG ---`);
    console.log(`Viewer: ${viewerUserId} | Owner: ${status.user.toString()}`);
    console.log(`Is Owner? ${isOwner}`);
    console.log(`Has Already Viewed? ${hasViewed}`);

    // This condition will now work correctly.
    if (!hasViewed && !isOwner) {
      console.log(`✅ ACTION: Adding viewer.`);
      status.viewers.push(viewerUserId);
      await status.save();
    } else {
      console.log(`❌ NO ACTION: Viewer is owner or has already viewed.`);
    }

    // We don't need to emit a socket event here, as the frontend will handle its own update.
    // The socket event is for notifying the OWNER, which we can refine later.

    return response(res, 200, 'Status viewed successfully');

  } catch (error) {
    console.error("Error in viewStatus controller:", error);
    return response(res, 500, "Internal Server Error");
  }
};


exports.deleteStatus = async(req,res) => {
    const {statusId} = req.params;
    const userId = req.user.userId;
    try {
        const status = await Status.findById(statusId);
        if(!status) {
            return response(res, 404 , "Status not found");
        }

        if(status.user.toString() !== userId) {
            return response(res,403, "Not authorized to delete this status")
        }

        await status.deleteOne();

        //Emit socket event
        if(req.io && req.socketUserMap) {
            for(const [connectingUserId, socketId] of req.socketUserMap) {
                if(connectingUserId !== userId) {
                    req.io.to(socketId).emit("status_deleted",statusId)
                }
            }
        }

        return response(res,200,"Satus deleted successfully")
    } catch (error) {
        return response(res, 500, 'Internal server error');
    }
}